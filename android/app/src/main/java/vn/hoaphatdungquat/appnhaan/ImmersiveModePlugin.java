package vn.hoaphatdungquat.appnhaan;

import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Ẩn/hiện cả status bar lẫn navigation bar (immersive mode). Fullscreen API
// của web (document.requestFullscreen) chỉ ẩn được chrome của trình duyệt,
// không đụng tới 2 thanh hệ thống của Android nên phải điều khiển bằng
// WindowInsetsController ở tầng native.
@CapacitorPlugin(name = "ImmersiveMode")
public class ImmersiveModePlugin extends Plugin {

    @PluginMethod
    public void enable(PluginCall call) {
        getActivity().runOnUiThread(() -> setImmersive(true));
        call.resolve();
    }

    @PluginMethod
    public void disable(PluginCall call) {
        getActivity().runOnUiThread(() -> setImmersive(false));
        call.resolve();
    }

    private void setImmersive(boolean immersive) {
        Window window = getActivity().getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, !immersive);

        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller == null) {
            return;
        }

        if (immersive) {
            // Cho phép vuốt mép màn hình để lộ tạm thanh hệ thống rồi tự ẩn lại,
            // thay vì khoá cứng hoàn toàn.
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
            controller.hide(WindowInsetsCompat.Type.systemBars());
        } else {
            controller.show(WindowInsetsCompat.Type.systemBars());
        }
    }
}
