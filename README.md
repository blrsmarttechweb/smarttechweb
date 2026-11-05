# Smart Tech - Official Website

Official website for **Smart Tech**, providing Enterprise IT Solutions, Government e-Marketplace (GeM) Procurement Support, Canon Consumables & Printers, Power Conditioning (Stabilizers/UPS), and Institutional Supplies.

- **Domain:** [https://www.smarttech.org.in](https://www.smarttech.org.in)
- **Deployment Platform:** [Render](https://render.com) (Static Site) & GoDaddy cPanel

---

## 🚀 Live Deployment on Render

This project is deployed as a **Static Site** on Render.

### Render Static Site Settings:
| Setting | Recommended Value |
|---|---|
| **Build Command** | *(Leave empty / None)* |
| **Publish Directory** | Smart Tech Website *(or root ./)* |
| **Branch** | main |
| **Auto-Deploy** | Yes |

> **Note on Publish Directory:**
> - If **Publish Directory** is set to Smart Tech Website, Render serves index.html directly from that directory.
> - If **Publish Directory** is set to root (./), the root index.html automatically forwards visitors into Smart Tech Website/index.html.

---

## 📁 Repository Structure

`	ext
SmartTech-Website-KHOLO/
├── index.html                   # Root entry point & automatic redirect to website
├── WEBSITE-KHOLO.html           # Local offline launcher for Windows
├── README.md                    # Project documentation & deployment guide
├── .gitignore                   # Ignored files (system/temp files)
└── Smart Tech Website/          # Core static website files
    ├── index.html               # Main homepage
    ├── about-smart-tech.html    # About Us
    ├── products.html            # Complete product catalog
    ├── brands.html              # Partner & supplier brands
    ├── solutions.html           # Corporate & institutional solutions
    ├── gem-and-government-procurement-support.html # GeM tender & procurement support
    ├── contact-us.html          # Contact page with interactive map & details
    ├── request-a-quote.html     # Dedicated RFQ form
    ├── become-a-partner-or-supplier.html # Vendor/partner registration
    ├── send-enquiry.php         # Server-side PHP mail handler (for cPanel/PHP hostings)
    ├── PEHLE-YE-PADHO.txt       # Quick instructions guide
    ├── assets/                  # Stylesheets, JavaScript, icons, and fonts
    ├── brand/                   # Brand assets and logos
    ├── category/                # Category listing pages
    ├── product/                 # Individual product landing pages
    └── uploads/                 # Product photography & marketing imagery
`

---

## 🛠️ Features & Highlights

1. **Responsive & Mobile-Ready:** Tailored UI optimized for mobile phones, tablets, and desktop workstations.
2. **Comprehensive Product Showcase:** Canon OEM toners/cartridges, line voltage correctors, workstation hardware, printers, and accessories.
3. **Dual Enquiry System:**
   - **PHP Mailer (send-enquiry.php):** On servers supporting PHP (e.g. GoDaddy cPanel), enquiries are dispatched directly to ishikesh@smarttech.org.in and archived in an internal enquiries log.
   - **Direct WhatsApp & Email Fallback:** On static hosting platforms (like Render or local viewing), enquiry buttons automatically launch WhatsApp or the user's default email client pre-filled with the quote request specifications.
4. **Government Procurement (GeM) Focus:** Pre-configured workflows and BoQ assistance for institutional and PSU buyers.

---

## 💻 Running Locally

To preview or test the website on your local machine:
1. Double-click WEBSITE-KHOLO.html or index.html.
2. Alternatively, run a lightweight local server:
   `ash
   # Using Python
   python -m http.server 8000
   `
   Open http://localhost:8000 in your web browser.

---

## 🌐 Deploying to GoDaddy / cPanel Hosting

If deploying to traditional cPanel hosting:
1. Open **cPanel > File Manager > public_html**.
2. Upload the contents of Smart Tech Website/ directly into public_html/.
3. Ensure .htaccess is uploaded (enable "Show Hidden Files" in cPanel settings).
4. Verify by opening https://www.smarttech.org.in.

---

## 📞 Support & Contact

- **Email:** [rishikesh@smarttech.org.in](mailto:rishikesh@smarttech.org.in)
- **Website:** [www.smarttech.org.in](https://www.smarttech.org.in)
