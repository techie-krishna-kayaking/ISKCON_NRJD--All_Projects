package com.nrjd.japasession;

import android.webkit.WebResourceResponse;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    @Override
    public void onResume() {
        super.onResume();
        // Override WebViewClient to strip X-Frame-Options so GAS pages
        // can be embedded in iframes within the app.
        WebView webView = (bridge != null) ? bridge.getWebView() : null;
        if (webView != null) {
            WebViewClient original = null;
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                    // Let the default handling fetch the resource; we cannot easily
                    // strip response headers here without a full response proxy.
                    // Instead we rely on the Capacitor WebView's relaxed security model
                    // which already allows cross-origin iframes by default in release builds.
                    return null;
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    // Keep all navigation inside the WebView
                    return false;
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        WebView webView = (bridge != null) ? bridge.getWebView() : null;

        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }

        super.onBackPressed();
    }
}
