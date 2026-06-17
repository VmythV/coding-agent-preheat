use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    pub id: String,
    pub name: String,
    pub kind: AgentKind,
    pub enabled: bool,
    pub command: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub env: Vec<EnvVar>,
    pub timeout_seconds: u64,
    pub schedules: Vec<Schedule>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentKind {
    Claude,
    Codex,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvVar {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub id: String,
    pub enabled: bool,
    pub kind: ScheduleKind,
    pub trigger_type: TriggerType,
    pub time: String,
    pub days_of_week: Vec<u8>,
    pub last_triggered_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ScheduleKind {
    Daily,
    Weekly,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TriggerType {
    Manual,
    #[serde(rename = "warmup_5h", alias = "warmup5h")]
    Warmup5h,
    Weekly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimePreset {
    pub id: String,
    pub label: String,
    pub kind: ScheduleKind,
    pub time: String,
    pub days_of_week: Vec<u8>,
    pub last_used_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunLog {
    pub id: String,
    pub agent_id: String,
    pub agent_name: String,
    pub trigger_type: TriggerType,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub command: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub exit_code: Option<i32>,
    pub status: RunStatus,
    pub stdout: String,
    pub stderr: String,
    pub error_message: Option<String>,
    pub duration_ms: Option<u128>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RunStatus {
    Running,
    Success,
    Failed,
    Timeout,
    Skipped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreData {
    pub agents: Vec<AgentConfig>,
    pub presets: Vec<TimePreset>,
    pub logs: Vec<RunLog>,
}
