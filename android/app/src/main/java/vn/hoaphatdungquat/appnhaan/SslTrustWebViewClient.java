package vn.hoaphatdungquat.appnhaan;

import android.content.Context;
import android.net.Uri;
import android.net.http.SslCertificate;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.List;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

/**
 * Chứng chỉ của API (*.hoaphatdungquat.vn) ký bởi "Sectigo Public Server
 * Authentication Root R46" — root mới, nhiều máy Android cũ không có trong kho
 * root hệ điều hành nên WebView từ chối kết nối (Chrome vẫn vào được vì dùng
 * kho root riêng). WebView không đọc network_security_config cho trust anchor,
 * nên ở đây tự xác thực lại chuỗi chứng chỉ bằng root R46 + intermediate
 * GoGetSSL nhúng trong res/raw.
 *
 * Chỉ cho qua khi: host nằm trong TRUSTED_HOSTS, lỗi DUY NHẤT là "untrusted"
 * (không lệch domain, không hết hạn...) và chứng chỉ server xác thực được với
 * 2 CA nhúng. Mọi trường hợp khác vẫn cancel như mặc định.
 */
public class SslTrustWebViewClient extends BridgeWebViewClient {

    private static final String TAG = "SslTrustWebViewClient";

    private static final List<String> TRUSTED_HOSTS = Arrays.asList("apinhaan.hoaphatdungquat.vn");

    private final X509TrustManager trustManager;

    public SslTrustWebViewClient(Bridge bridge, Context context) {
        super(bridge);
        this.trustManager = taoTrustManager(context);
    }

    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        if (coTheChoQua(error)) {
            handler.proceed();
        } else {
            super.onReceivedSslError(view, handler, error);
        }
    }

    private boolean coTheChoQua(SslError error) {
        if (trustManager == null) return false;

        String host = Uri.parse(error.getUrl()).getHost();
        if (host == null || !TRUSTED_HOSTS.contains(host.toLowerCase())) return false;

        if (!error.hasError(SslError.SSL_UNTRUSTED)
            || error.hasError(SslError.SSL_IDMISMATCH)
            || error.hasError(SslError.SSL_EXPIRED)
            || error.hasError(SslError.SSL_NOTYETVALID)
            || error.hasError(SslError.SSL_DATE_INVALID)
            || error.hasError(SslError.SSL_INVALID)) {
            return false;
        }

        X509Certificate leaf = layX509(error.getCertificate());
        if (leaf == null) return false;

        try {
            trustManager.checkServerTrusted(new X509Certificate[] { leaf }, "RSA");
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Chứng chỉ " + host + " không xác thực được với CA nhúng", e);
            return false;
        }
    }

    private static X509Certificate layX509(SslCertificate cert) {
        if (cert == null) return null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return cert.getX509Certificate();
        }
        // API < 29 không có getX509Certificate(): lấy bytes DER qua saveState.
        try {
            Bundle bundle = SslCertificate.saveState(cert);
            byte[] der = bundle.getByteArray("x509-certificate");
            if (der == null) return null;
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            return (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(der));
        } catch (Exception e) {
            Log.w(TAG, "Không đọc được chứng chỉ từ SslError", e);
            return null;
        }
    }

    private static X509TrustManager taoTrustManager(Context context) {
        try {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            KeyStore ks = KeyStore.getInstance(KeyStore.getDefaultType());
            ks.load(null, null);
            int[] resIds = { R.raw.sectigo_r46_root, R.raw.gogetssl_rsa_dv_ca2 };
            for (int i = 0; i < resIds.length; i++) {
                try (InputStream in = context.getResources().openRawResource(resIds[i])) {
                    ks.setCertificateEntry("ca" + i, cf.generateCertificate(in));
                }
            }
            TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            tmf.init(ks);
            for (TrustManager tm : tmf.getTrustManagers()) {
                if (tm instanceof X509TrustManager) return (X509TrustManager) tm;
            }
        } catch (Exception e) {
            Log.e(TAG, "Không nạp được CA nhúng", e);
        }
        return null;
    }
}
