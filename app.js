(function () {
  let activeIndex = 0;
  let searchQuery = '';
  let detailOpen = false;

  const cardsTrack = document.getElementById('cardsTrack');
  const emptyState = document.getElementById('emptyState');
  const emptyQuery = document.getElementById('emptyQuery');
  const resetSearchBtn = document.getElementById('resetSearchBtn');
  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const carouselView = document.getElementById('carouselView');
  const detailView = document.getElementById('detailView');
  const detailPanel = document.getElementById('detailPanel');
  const detailBadge = document.getElementById('detailBadge');
  const detailLogoImg = document.getElementById('detailLogoImg');
  const detailMedia = document.getElementById('detailMedia');
  const detailImg = document.getElementById('detailImg');
  const detailTitle = document.getElementById('detailTitle');
  const detailSubtitle = document.getElementById('detailSubtitle');
  const detailDescription = document.getElementById('detailDescription');
  const clipsGrid = document.getElementById('clipsGrid');
  const railItems = document.getElementById('railItems');
  const railNextBtn = document.getElementById('railNextBtn');
  const closeDetailBtn = document.getElementById('closeDetailBtn');
  const brandBtn = document.getElementById('brandBtn');

  const menuBtn = document.getElementById('menuBtn');
  const menuDrawer = document.getElementById('menuDrawer');
  const menuCloseBtn = document.getElementById('menuCloseBtn');
  const menuList = document.getElementById('menuList');

  const lightbox = document.getElementById('lightbox');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxImgWrap = document.getElementById('lightboxImgWrap');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCaption = document.getElementById('lightboxCaption');

  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 2400);
  }

  function getFilteredJerseys() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return JERSEYS;
    return JERSEYS.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.club.toLowerCase().includes(q) ||
        (j.season || '').toLowerCase().includes(q)
    );
  }

  function renderCarousel() {
    const list = getFilteredJerseys();
    cardsTrack.innerHTML = '';

    if (list.length === 0) {
      emptyState.hidden = false;
      emptyQuery.textContent = searchQuery;
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    emptyState.hidden = true;
    if (activeIndex >= list.length) activeIndex = 0;

    list.forEach((jersey, idx) => {
      const card = document.createElement('article');
      card.className = 'jersey-card' + (idx === activeIndex ? ' is-active' : '');
      card.style.background = jersey.gradient;
      card.style.boxShadow = `0 22px 42px ${jersey.accentShadow}`;
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${jersey.name} - ${jersey.club}`);

      card.innerHTML = `
        <div class="jersey-card-img-wrap">
          <img src="${jersey.image}" alt="${jersey.name}" />
        </div>
        <div class="jersey-card-body">
          <h2 class="jersey-card-title">${jersey.name}</h2>
          <p class="jersey-card-meta">Club <strong>${jersey.club}</strong></p>
          <span class="jersey-card-cta">Read more <span aria-hidden="true">&rsaquo;</span></span>
        </div>
      `;

      card.addEventListener('click', () => {
        const realIdx = JERSEYS.findIndex((item) => item.id === jersey.id);
        openDetail(realIdx, card);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const realIdx = JERSEYS.findIndex((item) => item.id === jersey.id);
          openDetail(realIdx, card);
        }
      });

      cardsTrack.appendChild(card);
    });

    prevBtn.disabled = list.length <= 1;
    nextBtn.disabled = list.length <= 1;
  }

  function renderDetail() {
    const jersey = JERSEYS[activeIndex];
    detailPanel.style.background = jersey.detailGradient;
    detailBadge.textContent = jersey.badge;
    detailLogoImg.src = jersey.clips[0].image;
    detailLogoImg.alt = `${jersey.name} crest`;
    detailImg.src = jersey.image;
    detailImg.alt = jersey.name;
    detailTitle.textContent = jersey.name;
    detailSubtitle.textContent = '';
    detailSubtitle.hidden = true;
    detailDescription.textContent = jersey.description;

    // Render side rail
    railItems.innerHTML = '';
    JERSEYS.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item' + (idx === activeIndex ? ' is-active' : '');
      btn.textContent = item.name;
      btn.addEventListener('click', () => {
        activeIndex = idx;
        renderDetail();
      });
      railItems.appendChild(btn);
    });

    // Detail thumbnails are intentionally hidden for a cleaner centered layout
    clipsGrid.innerHTML = '';
    clipsGrid.closest('.clips-section').hidden = true;
  }

  function openDetail(index, sourceCard) {
    let cardRect = null;
    let imgRect = null;
    if (sourceCard) {
      cardRect = sourceCard.getBoundingClientRect();
      const imgEl = sourceCard.querySelector('.jersey-card-img-wrap');
      if (imgEl) imgRect = imgEl.getBoundingClientRect();
    }

    activeIndex = index;
    detailOpen = true;
    carouselView.hidden = true;
    detailView.hidden = false;
    renderDetail();

    // FLIP shared-element expand animation matching the video
    if (cardRect && window.innerWidth > 900 && detailPanel.animate) {
      const panelRect = detailPanel.getBoundingClientRect();
      const dx = cardRect.left - panelRect.left;
      const dy = cardRect.top - panelRect.top;
      const sx = cardRect.width / panelRect.width;
      const sy = cardRect.height / panelRect.height;

      detailPanel.animate(
        [
          {
            transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
            borderRadius: '24px'
          },
          {
            transform: 'translate(0, 0) scale(1, 1)',
            borderRadius: '36px 0 0 0'
          }
        ],
        {
          duration: 460,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }
      );

      if (imgRect && detailMedia.animate) {
        const targetRect = detailMedia.getBoundingClientRect();
        const idx = imgRect.left - targetRect.left;
        const idy = imgRect.top - targetRect.top;
        const isx = imgRect.width / targetRect.width;
        const isy = imgRect.height / targetRect.height;

        detailMedia.animate(
          [
            {
              transform: `translate(${idx}px, calc(-50% + ${idy}px)) scale(${isx}, ${isy})`
            },
            {
              transform: 'translate(0, -50%) scale(1, 1)'
            }
          ],
          {
            duration: 480,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
          }
        );
      }
    }
  }

  function closeDetail() {
    detailOpen = false;
    detailView.hidden = true;
    carouselView.hidden = false;
    renderCarousel();
  }

  function openLightbox(clip, jersey) {
    lightboxImgWrap.style.background = jersey.gradient;
    lightboxImg.src = clip.image;
    lightboxImg.alt = clip.title;
    lightboxTitle.textContent = `${jersey.name} — ${clip.title}`;
    lightboxCaption.textContent = clip.caption;
    lightbox.hidden = false;
  }

  function closeLightbox() {
    lightbox.hidden = true;
  }

  function renderMenu() {
    menuList.innerHTML = '';
    JERSEYS.forEach((jersey, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'menu-item';
      btn.innerHTML = `
        <span class="menu-item-thumb" style="background: ${jersey.gradient}">
          <img src="${jersey.image}" alt="${jersey.name}" />
        </span>
        <span class="menu-item-text">
          <strong>${jersey.name}</strong>
        </span>
      `;
      btn.addEventListener('click', () => {
        menuDrawer.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
        openDetail(idx);
      });
      menuList.appendChild(btn);
    });
  }

  // Event listeners
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (detailOpen) closeDetail();
    renderCarousel();
  });

  resetSearchBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    renderCarousel();
  });

  prevBtn.addEventListener('click', () => {
    const list = getFilteredJerseys();
    if (list.length <= 1) return;
    activeIndex = (activeIndex - 1 + list.length) % list.length;
    renderCarousel();
  });

  nextBtn.addEventListener('click', () => {
    const list = getFilteredJerseys();
    if (list.length <= 1) return;
    activeIndex = (activeIndex + 1) % list.length;
    renderCarousel();
  });

  railNextBtn.addEventListener('click', () => {
    activeIndex = (activeIndex + 1) % JERSEYS.length;
    renderDetail();
  });

  closeDetailBtn.addEventListener('click', closeDetail);
  brandBtn.addEventListener('click', () => {
    if (detailOpen) closeDetail();
  });

  menuBtn.addEventListener('click', () => {
    const nextHidden = !menuDrawer.hidden;
    menuDrawer.hidden = nextHidden;
    menuBtn.setAttribute('aria-expanded', String(!nextHidden));
  });

  menuCloseBtn.addEventListener('click', () => {
    menuDrawer.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', (e) => {
    if (!menuDrawer.hidden && !menuDrawer.contains(e.target) && !menuBtn.contains(e.target)) {
      menuDrawer.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.querySelectorAll('.social-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Shared KBFC Jerseys showcase to ${btn.dataset.social}`);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!lightbox.hidden) closeLightbox();
      else if (!menuDrawer.hidden) {
        menuDrawer.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      } else if (detailOpen) closeDetail();
    } else if (e.key === 'ArrowRight') {
      if (detailOpen) {
        activeIndex = (activeIndex + 1) % JERSEYS.length;
        renderDetail();
      } else {
        nextBtn.click();
      }
    } else if (e.key === 'ArrowLeft') {
      if (detailOpen) {
        activeIndex = (activeIndex - 1 + JERSEYS.length) % JERSEYS.length;
        renderDetail();
      } else {
        prevBtn.click();
      }
    }
  });

  renderMenu();
  renderCarousel();
})();
