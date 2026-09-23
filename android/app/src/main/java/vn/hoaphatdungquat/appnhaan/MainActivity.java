package vn.hoaphatdungquat.appnhaan;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // installSplashScreen phải gọi trước super.onCreate() để chuyển từ choa
        // theme Theme.SplashScreen (khai báo ở AndroidManifest) sang
        // postSplashScreenTheme (AppTheme.NoActionBar) sau khi tắt splash.
        // Thiếu bước này khiến app chạy suốt với theme splash, gây khoảng
        // hở/chrome bất thường ở trên màn hình.
        SplashScreen.installSplashScreen(this);
        registerPlugin(ImmersiveModePlugin.class);
        super.onCreate(savedInstanceState);
        // Tin thêm root Sectigo R46 cho API — xem SslTrustWebViewClient.
        bridge.setWebViewClient(new SslTrustWebViewClient(bridge, this));
    }
}
