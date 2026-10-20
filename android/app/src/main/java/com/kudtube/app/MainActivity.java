package com.kudtube.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.WebSettings;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings webSettings = this.bridge.getWebView().getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            webSettings.setAllowFileAccess(true);

            this.bridge.getWebView().setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                    try {
                        String downloadUrl = url;
                        String filename = null;
                        if (url.contains("#kudtube_filename=")) {
                            try {
                                int idx = url.indexOf("#kudtube_filename=");
                                filename = Uri.decode(url.substring(idx + 18));
                                downloadUrl = url.substring(0, idx);
                            } catch (Exception ignored) {}
                        }
                        if (filename == null || filename.trim().isEmpty()) {
                            filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                        }

                        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
                        String cookies = CookieManager.getInstance().getCookie(url);
                        if (cookies != null) {
                            request.addRequestHeader("cookie", cookies);
                        }
                        request.addRequestHeader("User-Agent", userAgent);
                        request.setDescription("Downloading: " + filename);
                        request.setTitle(filename);
                        request.allowScanningByMediaScanner();
                        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);

                        DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                        if (dm != null) {
                            dm.enqueue(request);
                            Toast.makeText(getApplicationContext(), "Downloading: " + filename, Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception e) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW);
                            intent.setData(Uri.parse(url));
                            startActivity(intent);
                        } catch (Exception ex) {
                            Toast.makeText(getApplicationContext(), "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                        }
                    }
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().evaluateJavascript(
                "(function() { " +
                "  if (window.__kudtubeCanGoBack && window.__kudtubeCanGoBack()) { " +
                "    window.dispatchEvent(new CustomEvent('kudtube:back')); " +
                "    return 'true'; " +
                "  } " +
                "  return 'false'; " +
                "})();",
                value -> {
                    if ("\"false\"".equals(value) || "false".equals(value) || value == null) {
                        runOnUiThread(() -> MainActivity.super.onBackPressed());
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }
}
