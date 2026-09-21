import { registerPlugin } from "@capacitor/core";

export interface ImmersiveModePlugin {
    enable(): Promise<void>;
    disable(): Promise<void>;
}

// Plugin native cục bộ (android/app/src/main/java/.../ImmersiveModePlugin.java),
// không phải package npm — chỉ tồn tại trên Android, gọi qua Capacitor bridge.
const ImmersiveMode = registerPlugin<ImmersiveModePlugin>("ImmersiveMode");

export default ImmersiveMode;
