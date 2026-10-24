# Privacy Policy for Pixture

**Last Updated:** October 24, 2026  
**Effective Date:** October 24, 2026  

At **Pixture** ("we", "our", or "the Application"), we firmly believe that your personal photographs, memories, and biometric identity documents (such as passport photos, visa photos, and family portraits) belong exclusively to you.

Pixture is architected from the ground up as a **100% client-side, zero-knowledge, local-first web application**.

---

## 1. Summary of Core Privacy Principles

* **No Remote File Uploads:** Your photos never leave your device. All image decoding, rendering, cropping, color adjustment, grid layout, and PDF/PNG exports are executed strictly inside your device's web browser using client-side JavaScript, Canvas, and WebAssembly APIs.
* **No Cloud Storage or Remote Databases:** We do not operate remote photo storage servers or cloud databases. There is no server backend receiving, inspecting, or storing your pictures.
* **No Tracking, Telemetry, or Analytics:** Pixture contains zero third-party tracking scripts, zero advertising networks, zero analytics beacons (no Google Analytics, no Facebook Pixels), and zero invasive telemetry.
* **No Account Required:** You do not need an email, phone number, or password to use Pixture.

---

## 2. Information We Process and Where It Resides

### 2.1 Photographs and Image Data
When you select, drag, or drop photos into Pixture:
* Photos are read locally using standard browser `FileReader` and `ImageData` APIs.
* Photos are stored solely in your computer or device memory (RAM) while the browser tab is open.
* **Network Isolation:** No network requests (`fetch`, `XMLHttpRequest`, or `WebSocket`) are initiated with your image payload. You can disconnect your device from the internet (airplane mode) and Pixture will continue to work normally.

### 2.2 Local Session Storage (IndexedDB)
To prevent accidental loss of your work if you refresh the browser page or close your tab, Pixture may save your active project layout and cached image data locally on your device via the browser's built-in **IndexedDB** database (`idb-keyval`).
* This data is stored entirely on your local hard drive under your browser's private sandbox.
* Only your browser on your device has access to this storage.
* You can purge this data at any time by clearing your browser's site data, clicking "Reset Project" in the application, or opening Pixture in Private / Incognito browsing mode.

### 2.3 Project Files (`.pixture`)
If you choose to export your project via the `.pixture` file format, the resulting JSON file is saved directly to your local file system via your browser's download manager. We have no access to saved project files.

---

## 3. Biometric and Sensitive Personal Data

When creating government passport or visa photo sheets (US Passport, Schengen, UK, India, etc.), photos may contain sensitive facial geometry and biometric data:
* Pixture does **not** perform facial recognition, feature tagging, biometric harvesting, or AI model training.
* Your likeness remains strictly within your browser sandbox.

---

## 4. International Regulatory Compliance

Because Pixture does not collect, process, transfer, or store personal data on external servers:

* **General Data Protection Regulation (GDPR / UK GDPR):** In accordance with Article 25 ("Data protection by design and by default"), Pixture implements maximum data minimization. There is no "Data Controller" or "Data Processor" holding your data, as no personal data is collected.
* **California Consumer Privacy Act (CCPA / CPRA):** We do not sell, share, or monetize personal information.
* **PIPEDA (Canada) & APPI (Japan):** Full adherence to privacy principles through local client-side processing.

---

## 5. Security & Verification

Because Pixture is open source, its client-side architecture can be independently audited and verified:
1. Open the Developer Tools in your browser (`F12` or `Cmd+Option+I`).
2. Navigate to the **Network** tab.
3. Import, crop, edit photos, and export PDFs. You will observe that **zero network traffic** is generated containing your photos or personal data.

---

## 6. Open Source License & Contact

Pixture is published under the permissive **MIT License**. For technical questions, bug reports, or security disclosures, please open an issue in the project's source code repository.
