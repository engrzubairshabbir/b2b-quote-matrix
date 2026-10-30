/**
 * ConsultWays B2B Quote & Tiered Matrix Pro - Storefront Script
 * Lightweight Vanilla JavaScript with 0 external dependencies
 */

(function () {
  "use strict";

  function initB2BWidget() {
    const widget = document.querySelector(".cw-b2b-widget-wrapper");
    if (!widget) return;

    const shop = widget.dataset.shop || window.Shopify?.shop || "quickstart-demo.myshopify.com";
    const appUrl = widget.dataset.appUrl || window.location.origin;
    const productId = widget.dataset.productId || "";
    const productTitle = widget.dataset.productTitle || "";
    const productHandle = widget.dataset.productHandle || "";
    const productImage = widget.dataset.productImage || "";
    let variantId = widget.dataset.variantId || "";
    let unitPrice = parseFloat(widget.dataset.unitPrice) || 0;

    // Elements
    const cardsGrid = widget.querySelector(".cw-b2b-cards-grid");
    const ctaBtn = widget.querySelector(".cw-quote-cta-btn");
    const modalBackdrop = document.querySelector(".cw-modal-backdrop");
    const modalCloseBtn = document.querySelector(".cw-modal-close-btn");
    const form = document.querySelector("#cw-b2b-quote-form");
    const submitBtn = document.querySelector(".cw-btn-submit-quote");
    const successContainer = document.querySelector(".cw-success-container");
    const formContainer = document.querySelector(".cw-form-container");

    // Modal Calculator Elements
    const qtyInput = document.querySelector("#cw-calc-qty-input");
    const btnMinus = document.querySelector("#cw-calc-btn-minus");
    const btnPlus = document.querySelector("#cw-calc-btn-plus");
    const calcPriceDisplay = document.querySelector("#cw-calc-total-price");
    const calcSavingsDisplay = document.querySelector("#cw-calc-savings");

    // Default Tiers (Overwritten dynamically via API)
    let tiers = [
      { minQuantity: 1, maxQuantity: 9, discountPercent: 0, label: "1-9 Units", badgeText: "Standard Price" },
      { minQuantity: 10, maxQuantity: 49, discountPercent: 15, label: "10-49 Units", badgeText: "15% OFF" },
      { minQuantity: 50, maxQuantity: null, discountPercent: 25, label: "50+ Units", badgeText: "Best Value" },
    ];

    // Helper: Format Currency
    function formatMoney(amount) {
      return "$" + Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Helper: Determine applicable discount
    function getDiscountForQty(qty) {
      const sorted = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
      for (const t of sorted) {
        if (qty >= t.minQuantity) {
          if (t.maxQuantity === null || t.maxQuantity === undefined || qty <= t.maxQuantity) {
            return t.discountPercent;
          }
        }
      }
      return 0;
    }

    // Render Volume Tier Pricing Cards
    function renderTierCards() {
      if (!cardsGrid) return;
      cardsGrid.innerHTML = "";

      tiers.forEach((tier) => {
        const discountedUnit = unitPrice * (1 - tier.discountPercent / 100);
        const card = document.createElement("div");
        card.className = "cw-tier-card" + (tier.badgeText && tier.badgeText.includes("Best Value") ? " cw-best-value" : "");
        card.dataset.minQty = tier.minQuantity;

        let badgeHtml = "";
        if (tier.badgeText) {
          badgeHtml = `<span class="cw-tier-badge">${tier.badgeText}</span>`;
        }

        const qtyLabel = tier.maxQuantity ? `${tier.minQuantity} - ${tier.maxQuantity} Units` : `${tier.minQuantity}+ Units`;
        const discountLabel = tier.discountPercent > 0 ? `<div class="cw-tier-discount">${tier.discountPercent}% OFF</div>` : `<div class="cw-tier-discount" style="background:#f1f5f9;color:#64748b">Standard</div>`;

        card.innerHTML = `
          ${badgeHtml}
          <div class="cw-tier-qty">${qtyLabel}</div>
          <div class="cw-tier-price">${formatMoney(discountedUnit)}</div>
          <div class="cw-tier-unit">per item</div>
          ${discountLabel}
        `;

        card.addEventListener("click", () => {
          if (qtyInput) {
            qtyInput.value = tier.minQuantity;
            updateCalculator();
          }
          openModal();
        });

        cardsGrid.appendChild(card);
      });
    }

    // Fetch dynamic tiers from App Backend
    async function fetchDynamicTiers() {
      try {
        const res = await fetch(`${appUrl}/api/tiers?shop=${encodeURIComponent(shop)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.tiers && data.tiers.length > 0) {
            tiers = data.tiers;
            renderTierCards();
            updateCalculator();
          }
        }
      } catch (e) {
        // Fallback to embedded defaults
        console.warn("Could not fetch remote tiers, utilizing preset catalog tiers.", e);
      }
    }

    // Modal Calculator Calculation
    function updateCalculator() {
      if (!qtyInput) return;
      let qty = parseInt(qtyInput.value, 10);
      if (isNaN(qty) || qty < 1) qty = 1;

      const discountPercent = getDiscountForQty(qty);
      const discountedUnit = unitPrice * (1 - discountPercent / 100);
      const originalTotal = unitPrice * qty;
      const finalTotal = discountedUnit * qty;
      const totalSaved = originalTotal - finalTotal;

      if (calcPriceDisplay) {
        calcPriceDisplay.textContent = formatMoney(finalTotal);
      }

      if (calcSavingsDisplay) {
        if (discountPercent > 0) {
          calcSavingsDisplay.textContent = `★ ${discountPercent}% OFF Tier applied (You save ${formatMoney(totalSaved)})`;
          calcSavingsDisplay.style.display = "block";
        } else {
          calcSavingsDisplay.textContent = "Standard bulk rate. Add more units for wholesale discounts!";
          calcSavingsDisplay.style.color = "#94A3B8";
          calcSavingsDisplay.style.display = "block";
        }
      }

      // Highlight active card in grid
      const cards = cardsGrid?.querySelectorAll(".cw-tier-card");
      cards?.forEach((c) => {
        const minQ = parseInt(c.dataset.minQty, 10);
        c.classList.toggle("cw-active-tier", qty >= minQ);
      });
    }

    // Modal Control Functions
    function openModal() {
      if (!modalBackdrop) return;
      if (successContainer) successContainer.style.display = "none";
      if (formContainer) formContainer.style.display = "block";
      modalBackdrop.classList.add("cw-modal-open");
      updateCalculator();
    }

    function closeModal() {
      if (!modalBackdrop) return;
      modalBackdrop.classList.remove("cw-modal-open");
    }

    // Quantity button events
    btnMinus?.addEventListener("click", () => {
      let cur = parseInt(qtyInput.value, 10) || 1;
      if (cur > 1) {
        qtyInput.value = cur - 1;
        updateCalculator();
      }
    });

    btnPlus?.addEventListener("click", () => {
      let cur = parseInt(qtyInput.value, 10) || 1;
      qtyInput.value = cur + 1;
      updateCalculator();
    });

    qtyInput?.addEventListener("input", updateCalculator);

    // Modal Open/Close events
    ctaBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });

    modalCloseBtn?.addEventListener("click", closeModal);

    modalBackdrop?.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    // Form Submission
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!submitBtn) return;

      const qty = parseInt(qtyInput?.value, 10) || 1;
      const customerName = form.querySelector('[name="customerName"]')?.value;
      const customerEmail = form.querySelector('[name="customerEmail"]')?.value;
      const companyName = form.querySelector('[name="companyName"]')?.value;
      const phone = form.querySelector('[name="phone"]')?.value;
      const taxId = form.querySelector('[name="taxId"]')?.value;
      const shippingAddress = form.querySelector('[name="shippingAddress"]')?.value;
      const targetDeliveryDate = form.querySelector('[name="targetDeliveryDate"]')?.value;
      const notes = form.querySelector('[name="notes"]')?.value;

      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>⏳</span> Submitting High-Ticket Inquiry...`;

      const payload = {
        shop,
        productId,
        productTitle,
        productHandle,
        productImage,
        variantId,
        variantTitle: widget.dataset.variantTitle || "",
        unitPrice,
        quantity: qty,
        customerName,
        customerEmail,
        companyName,
        phone,
        taxId,
        shippingAddress,
        targetDeliveryDate,
        notes,
      };

      try {
        let result = null;
        if (appUrl && !appUrl.includes("example.com")) {
          try {
            const response = await fetch(`${appUrl}/api/quote`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (response.ok) {
              result = await response.json();
            }
          } catch (netErr) {
            console.warn("Backend sync notice:", netErr);
          }
        }

        const existing = JSON.parse(localStorage.getItem("cw_b2b_quotes") || "[]");
        const quoteNo = result?.quoteNumber || ("CW-Q" + (1000 + existing.length + 1));
        existing.push({ ...payload, quoteNumber: quoteNo, createdAt: new Date().toISOString() });
        localStorage.setItem("cw_b2b_quotes", JSON.stringify(existing));

        if (formContainer) formContainer.style.display = "none";
        if (successContainer) {
          successContainer.style.display = "flex";
          const quoteNoEl = successContainer.querySelector(".cw-success-quote-no");
          if (quoteNoEl) quoteNoEl.textContent = `Quote #${quoteNo}`;
        }
        form.reset();
      } catch (err) {
        console.error("Submission error:", err);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });


    // Initial render
    renderTierCards();
    fetchDynamicTiers();
  }

  // Auto-initialize when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initB2BWidget);
  } else {
    initB2BWidget();
  }
})();
