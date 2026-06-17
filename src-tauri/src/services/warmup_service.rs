use crate::error::{AppError, AppResult};
use crate::models::warmup::{
    AgentConfig, AgentKind, EnvVar, RunLog, RunStatus, Schedule, ScheduleKind, StoreData,
    TimePreset, TriggerType,
};
use chrono::{Datelike, Local};
use std::collections::HashSet;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use std::time::Instant;
use tauri::{AppHandle, Manager};
use tokio::process::Command;
use tokio::sync::{Mutex, RwLock};
use tokio::time::{timeout, Duration};
use uuid::Uuid;

const STORE_FILE: &str = "warmup-store.json";
const MAX_LOGS: usize = 500;

#[derive(Clone)]
pub struct WarmupState {
    store_path: PathBuf,
    data: Arc<RwLock<StoreData>>,
    running_agents: Arc<Mutex<HashSet<String>>>,
}

impl WarmupState {
    pub fn new(app: &AppHandle) -> AppResult<Self> {
        let app_data_dir = app
            .path()
            .app_data_dir()
            .map_err(|error| AppError::Command(error.to_string()))?;
        std::fs::create_dir_all(&app_data_dir)?;
        let store_path = app_data_dir.join(STORE_FILE);
        let data = if store_path.exists() {
            let raw = std::fs::read_to_string(&store_path)?;
            serde_json::from_str(&raw)?
        } else {
            let data = default_store();
            std::fs::write(&store_path, serde_json::to_string_pretty(&data)?)?;
            data
        };

        Ok(Self {
            store_path,
            data: Arc::new(RwLock::new(data)),
            running_agents: Arc::new(Mutex::new(HashSet::new())),
        })
    }

    pub async fn list_agents(&self) -> Vec<AgentConfig> {
        self.data.read().await.agents.clone()
    }

    pub async fn list_presets(&self) -> Vec<TimePreset> {
        self.data.read().await.presets.clone()
    }

    pub async fn list_logs(&self) -> Vec<RunLog> {
        let mut logs = self.data.read().await.logs.clone();
        logs.reverse();
        logs
    }

    pub async fn save_agent(&self, mut agent: AgentConfig) -> AppResult<AgentConfig> {
        let now = now_rfc3339();
        if agent.id.trim().is_empty() {
            agent.id = Uuid::new_v4().to_string();
            agent.created_at = now.clone();
        }
        if agent.created_at.trim().is_empty() {
            agent.created_at = now.clone();
        }
        agent.updated_at = now;

        let mut data = self.data.write().await;
        match data.agents.iter().position(|item| item.id == agent.id) {
            Some(index) => data.agents[index] = agent.clone(),
            None => data.agents.push(agent.clone()),
        }
        self.persist_locked(&data)?;
        Ok(agent)
    }

    pub async fn delete_agent(&self, id: String) -> AppResult<()> {
        let mut data = self.data.write().await;
        data.agents.retain(|item| item.id != id);
        self.persist_locked(&data)
    }

    pub async fn save_preset(&self, mut preset: TimePreset) -> AppResult<TimePreset> {
        if preset.id.trim().is_empty() {
            preset.id = Uuid::new_v4().to_string();
        }
        preset.last_used_at = now_rfc3339();

        let mut data = self.data.write().await;
        match data.presets.iter().position(|item| item.id == preset.id) {
            Some(index) => data.presets[index] = preset.clone(),
            None => data.presets.push(preset.clone()),
        }
        self.persist_locked(&data)?;
        Ok(preset)
    }

    pub async fn delete_preset(&self, id: String) -> AppResult<()> {
        let mut data = self.data.write().await;
        data.presets.retain(|item| item.id != id);
        self.persist_locked(&data)
    }

    pub async fn trigger_agent(&self, agent_id: String, trigger_type: TriggerType) -> AppResult<RunLog> {
        let agent = self
            .data
            .read()
            .await
            .agents
            .iter()
            .find(|item| item.id == agent_id)
            .cloned()
            .ok_or_else(|| AppError::Command("Agent not found".to_string()))?;

        self.run_agent(agent, trigger_type).await
    }

    pub async fn tick(&self) -> AppResult<()> {
        let now = Local::now();
        let current_time = now.format("%H:%M").to_string();
        let today_key = now.format("%Y-%m-%d").to_string();
        let minute_key = now.format("%Y-%m-%dT%H:%M").to_string();
        let weekday = now.weekday().num_days_from_monday() as u8 + 1;
        let mut due_agents: Vec<(AgentConfig, TriggerType)> = Vec::new();

        {
            let mut data = self.data.write().await;
            let mut changed = false;
            for agent in data.agents.iter_mut().filter(|agent| agent.enabled) {
                let mut agent_due: Vec<TriggerType> = Vec::new();
                for schedule in agent.schedules.iter_mut().filter(|schedule| schedule.enabled) {
                    if schedule.time != current_time {
                        continue;
                    }
                    if schedule.last_triggered_at.as_deref() == Some(&minute_key) {
                        continue;
                    }
                    let is_due = match schedule.kind {
                        ScheduleKind::Daily => schedule.days_of_week.is_empty()
                            || schedule.days_of_week.contains(&weekday),
                        ScheduleKind::Weekly => schedule.days_of_week.contains(&weekday),
                    };
                    if !is_due {
                        continue;
                    }

                    schedule.last_triggered_at = Some(minute_key.clone());
                    changed = true;
                    agent_due.push(schedule.trigger_type.clone());
                }
                if !agent_due.is_empty() {
                    let agent_snapshot = agent.clone();
                    due_agents.extend(
                        agent_due
                            .into_iter()
                            .map(|trigger_type| (agent_snapshot.clone(), trigger_type)),
                    );
                }
            }
            if changed {
                self.persist_locked(&data)?;
            }
        }

        for (agent, trigger_type) in due_agents {
            let state = self.clone();
            let run_day = today_key.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(error) = state.run_agent(agent, trigger_type).await {
                    log::error!("scheduled warmup failed on {}: {}", run_day, error);
                }
            });
        }

        Ok(())
    }

    async fn run_agent(&self, agent: AgentConfig, trigger_type: TriggerType) -> AppResult<RunLog> {
        {
            let mut running = self.running_agents.lock().await;
            if running.contains(&agent.id) {
                let log = self.build_skipped_log(&agent, trigger_type);
                self.push_log(log.clone()).await?;
                return Ok(log);
            }
            running.insert(agent.id.clone());
        }

        let result = self.execute_agent(agent.clone(), trigger_type).await;
        self.running_agents.lock().await.remove(&agent.id);
        result
    }

    async fn execute_agent(&self, agent: AgentConfig, trigger_type: TriggerType) -> AppResult<RunLog> {
        let started_at = now_rfc3339();
        let start = Instant::now();
        let command_line = command_line(&agent.command, &agent.args);
        let mut command = Command::new("/bin/zsh");
        command.arg("-lc").arg(&command_line);
        if let Some(cwd) = &agent.cwd {
            if !cwd.trim().is_empty() {
                command.current_dir(cwd);
            }
        }
        for EnvVar { key, value } in &agent.env {
            if !key.trim().is_empty() {
                command.env(key, value);
            }
        }
        command.stdout(Stdio::piped()).stderr(Stdio::piped());

        let run = timeout(Duration::from_secs(agent.timeout_seconds.max(1)), command.output()).await;
        let mut log = RunLog {
            id: Uuid::new_v4().to_string(),
            agent_id: agent.id,
            agent_name: agent.name,
            trigger_type,
            started_at,
            finished_at: Some(now_rfc3339()),
            command: agent.command,
            args: agent.args,
            cwd: agent.cwd,
            exit_code: None,
            status: RunStatus::Failed,
            stdout: String::new(),
            stderr: String::new(),
            error_message: None,
            duration_ms: Some(start.elapsed().as_millis()),
        };

        match run {
            Ok(Ok(output)) => {
                log.exit_code = output.status.code();
                log.stdout = redact(String::from_utf8_lossy(&output.stdout).to_string());
                log.stderr = redact(String::from_utf8_lossy(&output.stderr).to_string());
                log.status = if output.status.success() {
                    RunStatus::Success
                } else {
                    RunStatus::Failed
                };
            }
            Ok(Err(error)) => {
                log.error_message = Some(error.to_string());
                log.status = RunStatus::Failed;
            }
            Err(_) => {
                log.error_message = Some("Command timed out".to_string());
                log.status = RunStatus::Timeout;
            }
        }

        self.push_log(log.clone()).await?;
        Ok(log)
    }

    fn build_skipped_log(&self, agent: &AgentConfig, trigger_type: TriggerType) -> RunLog {
        RunLog {
            id: Uuid::new_v4().to_string(),
            agent_id: agent.id.clone(),
            agent_name: agent.name.clone(),
            trigger_type,
            started_at: now_rfc3339(),
            finished_at: Some(now_rfc3339()),
            command: agent.command.clone(),
            args: agent.args.clone(),
            cwd: agent.cwd.clone(),
            exit_code: None,
            status: RunStatus::Skipped,
            stdout: String::new(),
            stderr: String::new(),
            error_message: Some("Agent is already running".to_string()),
            duration_ms: Some(0),
        }
    }

    async fn push_log(&self, log: RunLog) -> AppResult<()> {
        let mut data = self.data.write().await;
        data.logs.push(log);
        if data.logs.len() > MAX_LOGS {
            let remove_count = data.logs.len() - MAX_LOGS;
            data.logs.drain(0..remove_count);
        }
        self.persist_locked(&data)
    }

    fn persist_locked(&self, data: &StoreData) -> AppResult<()> {
        std::fs::write(&self.store_path, serde_json::to_string_pretty(data)?)?;
        Ok(())
    }
}

pub fn spawn_scheduler(state: WarmupState) {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        loop {
            interval.tick().await;
            if let Err(error) = state.tick().await {
                log::error!("warmup scheduler tick failed: {}", error);
            }
        }
    });
}

fn default_store() -> StoreData {
    let now = now_rfc3339();
    StoreData {
        agents: vec![default_claude_agent(&now), default_codex_agent(&now)],
        presets: vec![
            preset("Morning", ScheduleKind::Daily, "06:00", vec![1, 2, 3, 4, 5], &now),
            preset("Midday", ScheduleKind::Daily, "11:00", vec![1, 2, 3, 4, 5], &now),
            preset("Afternoon", ScheduleKind::Daily, "16:00", vec![1, 2, 3, 4, 5], &now),
            preset("Weekly Monday", ScheduleKind::Weekly, "06:00", vec![1], &now),
        ],
        logs: Vec::new(),
    }
}

fn default_claude_agent(now: &str) -> AgentConfig {
    AgentConfig {
        id: Uuid::new_v4().to_string(),
        name: "Claude Code".to_string(),
        kind: AgentKind::Claude,
        enabled: false,
        command: "claude".to_string(),
        args: vec![
            "-p".to_string(),
            "hi".to_string(),
            "--model".to_string(),
            "haiku".to_string(),
            "--no-session-persistence".to_string(),
        ],
        cwd: None,
        env: Vec::new(),
        timeout_seconds: 120,
        schedules: default_schedules(),
        created_at: now.to_string(),
        updated_at: now.to_string(),
    }
}

fn default_codex_agent(now: &str) -> AgentConfig {
    AgentConfig {
        id: Uuid::new_v4().to_string(),
        name: "Codex".to_string(),
        kind: AgentKind::Codex,
        enabled: false,
        command: "codex".to_string(),
        args: vec![
            "exec".to_string(),
            "--ephemeral".to_string(),
            "--skip-git-repo-check".to_string(),
            "hi".to_string(),
        ],
        cwd: None,
        env: Vec::new(),
        timeout_seconds: 180,
        schedules: default_schedules(),
        created_at: now.to_string(),
        updated_at: now.to_string(),
    }
}

fn default_schedules() -> Vec<Schedule> {
    vec![
        Schedule {
            id: Uuid::new_v4().to_string(),
            enabled: false,
            kind: ScheduleKind::Daily,
            trigger_type: TriggerType::Warmup5h,
            time: "06:00".to_string(),
            days_of_week: vec![1, 2, 3, 4, 5],
            last_triggered_at: None,
        },
        Schedule {
            id: Uuid::new_v4().to_string(),
            enabled: false,
            kind: ScheduleKind::Weekly,
            trigger_type: TriggerType::Weekly,
            time: "06:00".to_string(),
            days_of_week: vec![1],
            last_triggered_at: None,
        },
    ]
}

fn preset(label: &str, kind: ScheduleKind, time: &str, days_of_week: Vec<u8>, now: &str) -> TimePreset {
    TimePreset {
        id: Uuid::new_v4().to_string(),
        label: label.to_string(),
        kind,
        time: time.to_string(),
        days_of_week,
        last_used_at: now.to_string(),
    }
}

fn now_rfc3339() -> String {
    Local::now().to_rfc3339()
}

fn command_line(command: &str, args: &[String]) -> String {
    let mut parts = vec![shell_words::quote(command).to_string()];
    parts.extend(args.iter().map(|arg| shell_words::quote(arg).to_string()));
    parts.join(" ")
}

fn redact(value: String) -> String {
    let mut redacted = value;
    for marker in ["OPENAI_API_KEY=", "ANTHROPIC_API_KEY=", "CODEX_API_KEY="] {
        while let Some(index) = redacted.find(marker) {
            let start = index + marker.len();
            let end = redacted[start..]
                .find(|c: char| c.is_whitespace())
                .map(|offset| start + offset)
                .unwrap_or(redacted.len());
            redacted.replace_range(start..end, "[redacted]");
        }
    }
    redacted
}
