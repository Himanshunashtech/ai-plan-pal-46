> 🚦 **Native Setup Source of Truth**
> Before any native feature work, open **`DESPIA_README.md`**, then open the **Despia sitemap**, pick the feature page, and use the **latest Lovable Prompt** from that page.

# Despia Native Integration

## Deep Linking Requirements

### iOS - Apple App Site Association (AASA)
**Host at:** `/.well-known/apple-app-site-association` (HTTPS, JSON, no redirects)
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.BUNDLEID"],
        "components": [{ "/": "/*" }]
      }
    ]
  }
}
```

### Android - Digital Asset Links
**Host at:** `/.well-known/assetlinks.json` (HTTPS, JSON, no redirects)
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "PACKAGE_NAME",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT"]
    }
  }
]
```

## RevenueCat Authority Model
- **Concept**: Server is the authority. `iapSuccess` on client is a **hint**.
- **Action**: On `iapSuccess`, show optimistic UI, but wait for server confirmation via realtime/polling.
- **Offerings**: Fetch from server, do not hardcode.

## Device Linking
After login/auth, link device identities:
```ts
// Send to backend
const deviceData = {
  uuid: despia.uuid,
  onesignalPlayerId: despia.onesignalplayerid
};
```

## Documentation Sources (memory-proof)
- Primary sitemap: http://lovable.despia.com/sitemap.xml
- Feature page(s) used most recently:
  - User-provided Prompt (Despia x Lovable Authoritative Prompt)
  - RevenueCat, OneSignal, Health Connect (via prompt)
