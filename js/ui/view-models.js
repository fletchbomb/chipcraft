export function buildScreenViewModel(state) {
  return {
    route: state.route,
    mode: state.mode,
    chipCount: state.content.chips.length,
    frameCount: state.content.frames.length,
    aiPresetCount: state.content.aiPresets.length,
    statusCount: state.content.statuses.length,
  };
}
