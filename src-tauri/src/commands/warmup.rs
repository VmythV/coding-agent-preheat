use crate::error::AppResult;
use crate::models::warmup::{AgentConfig, RunLog, TimePreset, TriggerType};
use crate::services::warmup_service::WarmupState;

#[tauri::command]
pub async fn warmup_list_agents(state: tauri::State<'_, WarmupState>) -> AppResult<Vec<AgentConfig>> {
    Ok(state.list_agents().await)
}

#[tauri::command]
pub async fn warmup_save_agent(
    state: tauri::State<'_, WarmupState>,
    agent: AgentConfig,
) -> AppResult<AgentConfig> {
    state.save_agent(agent).await
}

#[tauri::command]
pub async fn warmup_delete_agent(state: tauri::State<'_, WarmupState>, id: String) -> AppResult<()> {
    state.delete_agent(id).await
}

#[tauri::command]
pub async fn warmup_trigger_agent(
    state: tauri::State<'_, WarmupState>,
    agent_id: String,
    trigger_type: TriggerType,
) -> AppResult<RunLog> {
    state.trigger_agent(agent_id, trigger_type).await
}

#[tauri::command]
pub async fn warmup_list_logs(state: tauri::State<'_, WarmupState>) -> AppResult<Vec<RunLog>> {
    Ok(state.list_logs().await)
}

#[tauri::command]
pub async fn warmup_list_presets(state: tauri::State<'_, WarmupState>) -> AppResult<Vec<TimePreset>> {
    Ok(state.list_presets().await)
}

#[tauri::command]
pub async fn warmup_save_preset(
    state: tauri::State<'_, WarmupState>,
    preset: TimePreset,
) -> AppResult<TimePreset> {
    state.save_preset(preset).await
}

#[tauri::command]
pub async fn warmup_delete_preset(state: tauri::State<'_, WarmupState>, id: String) -> AppResult<()> {
    state.delete_preset(id).await
}
