(function () {
  let activeIndex = 0;
  let detailRenderToken = 0;
  let renderedDetailIndex = 0;
  let searchQuery = '';
  let detailOpen = false;
  let isTransitioning = false;
  let detailTransitionAnimations = [];
  let transitionCard = null;
  let transitionImageClone = null;

  const cardsTrack = document.getElementById('cardsTrack');
  const emptyState = document.getElementById('emptyState');
  const emptyQuery = document.getElementById('emptyQuery');
  const resetSearchBtn = document.getElementById('resetSearchBtn');
  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const carouselView = document.getElementById('carouselView');
  const detailView = document.getElementById('detailView');
  const detailRail = document.querySelector('.detail-rail');
  const detailTopBar = document.querySelector('.detail-top-bar');
  const detailPanel = document.getElementById('detailPanel');
  const detailMedia = document.getElementById('detailMedia');
  const detailImg = document.getElementById('detailImg');
  const detailBackMedia = document.getElementById('detailBackMedia');
  const detailBackImg = document.getElementById('detailBackImg');
  const detailTitle = document.getElementById('detailTitle');
  const detailSubtitle = document.getElementById('detailSubtitle');
  const detailDescription = document.getElementById('detailDescription');
  const clipsSection = document.querySelector('.clips-section');
  const clipsGrid = document.getElementById('clipsGrid');
  const railItems = document.getElementById('railItems');
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

  const EASE_OUT_EXPO = 'cubic-bezier(0.22, 1, 0.36, 1)';

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
      card.dataset.jerseyId = jersey.id;
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

  function animateDetailContentSwitch() {
    const targets = [detailTitle, detailSubtitle, detailDescription, clipsSection];
    targets.forEach((el, i) => {
      if (!el || !el.animate) return;
      el.animate(
        [
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 380,
          delay: i * 45,
          easing: EASE_OUT_EXPO,
          fill: 'both'
        }
      );
    });
  }

  function renderDetail(animateSwitch = false) {
    const jersey = JERSEYS[activeIndex];
    if (animateSwitch) {
      const requestToken = ++detailRenderToken;
      const nextIndex = activeIndex;
      const previousIndex = renderedDetailIndex;
      const imageSources = [jersey.image, jersey.backImage].filter(Boolean);

      Promise.all(
        imageSources.map((source) => {
          const image = new Image();
          image.src = source;
          return image.decode();
        })
      )
        .then(() => {
          if (requestToken !== detailRenderToken || !detailOpen) return;
          renderDetailContent(jersey, nextIndex, true);
        })
        .catch((error) => {
          if (requestToken !== detailRenderToken || !detailOpen) return;
          activeIndex = previousIndex;
          console.error(`Unable to load images for ${jersey.name}`, error);
          showToast(`Could not load ${jersey.name}.`);
        });
      return;
    }

    detailRenderToken += 1;
    renderDetailContent(jersey, activeIndex, false);
  }

  function renderDetailContent(jersey, jerseyIndex, animateSwitch) {
    renderedDetailIndex = jerseyIndex;
    detailPanel.style.setProperty('--detail-panel-background', jersey.detailGradient);
    detailImg.src = jersey.image;
    detailBackImg.src = jersey.backImage || '';
    detailBackImg.alt = `${jersey.name} — back side`;
    detailBackMedia.hidden = !jersey.backImage;
    detailImg.classList.remove('is-back');
    detailImg.alt = `${jersey.name} — front side`;
    detailTitle.textContent = jersey.name;
    detailSubtitle.hidden = false;
    detailSubtitle.innerHTML = `Club <strong>${jersey.club}</strong>`;
    detailDescription.textContent = jersey.description;

    // Render side rail
    railItems.innerHTML = '';
    JERSEYS.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item' + (idx === jerseyIndex ? ' is-active' : '');
      btn.textContent = item.name;
      btn.addEventListener('click', () => {
        if (idx === activeIndex) return;
        activeIndex = idx;
        lastSide = 'front';
        detailImg.style.transform = '';
        renderDetail(true);
      });
      railItems.appendChild(btn);
    });

    if (animateSwitch) {
      animateDetailContentSwitch();
    }
  }

  function clearDetailTransition() {
    detailTransitionAnimations.forEach((animation) => animation.cancel());
    detailTransitionAnimations = [];
    if (transitionCard) transitionCard.style.opacity = '';
    transitionCard = null;
    if (transitionImageClone) transitionImageClone.remove();
    transitionImageClone = null;
    detailImg.style.visibility = '';
    isTransitioning = false;
  }

  function animateTransitionElement(element, keyframes, options) {
    if (!element || !element.animate) return null;
    const animation = element.animate(keyframes, { ...options, fill: 'both' });
    detailTransitionAnimations.push(animation);
    return animation;
  }

  function getPanelTransform(fromRect, toRect) {
    return `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px) scale(${toRect.width / fromRect.width}, ${toRect.height / fromRect.height})`;
  }

  function animateDetailOpen(sourceCard) {
    if (
      !sourceCard ||
      !detailPanel.animate ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const sourceRect = sourceCard.getBoundingClientRect();
    const panelRect = detailPanel.getBoundingClientRect();
    const sourceImage = sourceCard.querySelector('.jersey-card-img-wrap img');
    const jersey = JERSEYS[activeIndex];
    transitionCard = sourceCard;
    sourceCard.style.opacity = '0';
    isTransitioning = true;

    if (sourceImage) {
      const sourceImageRect = sourceImage.getBoundingClientRect();
      const detailImageRect = detailImg.getBoundingClientRect();
      const imageStyle = window.getComputedStyle(sourceImage);
      transitionImageClone = sourceImage.cloneNode();
      transitionImageClone.alt = '';
      Object.assign(transitionImageClone.style, {
        position: 'fixed',
        left: `${sourceImageRect.left}px`,
        top: `${sourceImageRect.top}px`,
        width: `${sourceImageRect.width}px`,
        height: `${sourceImageRect.height}px`,
        maxWidth: 'none',
        maxHeight: 'none',
        objectFit: 'contain',
        filter: imageStyle.filter,
        pointerEvents: 'none',
        zIndex: '25',
        willChange: 'left, top, width, height'
      });
      document.body.appendChild(transitionImageClone);
      detailImg.style.visibility = 'hidden';
      animateTransitionElement(
        transitionImageClone,
        [
          {
            left: `${sourceImageRect.left}px`,
            top: `${sourceImageRect.top}px`,
            width: `${sourceImageRect.width}px`,
            height: `${sourceImageRect.height}px`
          },
          {
            left: `${detailImageRect.left}px`,
            top: `${detailImageRect.top}px`,
            width: `${detailImageRect.width}px`,
            height: `${detailImageRect.height}px`
          }
        ],
        { duration: 740, easing: EASE_OUT_EXPO }
      );
    }

    const panelAnimation = animateTransitionElement(
      detailPanel,
      [
        {
          transform: getPanelTransform(panelRect, sourceRect),
          borderRadius: '24px'
        },
        {
          transform: 'translate(0, 0) scale(1, 1)'
        }
      ],
      { duration: 740, easing: EASE_OUT_EXPO }
    );
    animateTransitionElement(
      detailPanel,
      [
        { background: sourceCard.style.background, borderRadius: '24px' },
        { background: jersey.detailGradient, borderRadius: '40px 0 0 0' }
      ],
      { duration: 740, easing: EASE_OUT_EXPO, pseudoElement: '::before' }
    );

    if (!sourceImage) {
      animateTransitionElement(
        detailMedia,
        [
          { opacity: 0, transform: 'translateY(18px) scale(0.94)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ],
        { duration: 440, delay: 120, easing: EASE_OUT_EXPO }
      );
    }
    animateTransitionElement(
      detailView.querySelector('.detail-content'),
      [
        { opacity: 0, transform: 'translateX(24px)' },
        { opacity: 1, transform: 'translateX(0)' }
      ],
      { duration: 400, delay: 220, easing: EASE_OUT_EXPO }
    );
    animateTransitionElement(
      detailBackMedia,
      [
        { opacity: 0, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 400, delay: 240, easing: EASE_OUT_EXPO }
    );
    animateTransitionElement(
      detailRail,
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 360, delay: 180, easing: EASE_OUT_EXPO }
    );
    animateTransitionElement(
      detailTopBar,
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 340, delay: 200, easing: EASE_OUT_EXPO }
    );
    if (panelAnimation) {
      panelAnimation.onfinish = () => {
        clearDetailTransition();
        if (detailOpen) {
          carouselView.style.opacity = '';
        }
      };
    } else {
      clearDetailTransition();
    }
  }

  function openDetail(index, sourceCard = null) {
    if (isTransitioning) return;

    activeIndex = index;
    lastSide = 'front';
    detailImg.style.transform = '';
    detailOpen = true;

    carouselView.style.opacity = '';
    carouselView.style.pointerEvents = '';

    detailView.hidden = false;
    renderDetail(false);
    animateDetailOpen(sourceCard);
  }

  function closeDetail() {
    if (!detailOpen) return;

    detailRenderToken += 1;
    if (isTransitioning) {
      clearDetailTransition();
    }

    detailOpen = false;
    detailView.hidden = true;
    carouselView.hidden = false;
    carouselView.style.opacity = '';
    carouselView.style.pointerEvents = '';
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
        if (detailOpen) {
          activeIndex = idx;
          lastSide = 'front';
          detailImg.style.transform = '';
          renderDetail(true);
        } else {
          openDetail(idx);
        }
      });
      menuList.appendChild(btn);
    });
  }

  // Event listeners
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (detailOpen) {
      detailOpen = false;
      detailView.hidden = true;
      carouselView.hidden = false;
    }
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
        showingBack = false;
        lastSide = 'front';
        detailImg.style.transform = '';
        renderDetail(true);
      } else {
        nextBtn.click();
      }
    } else if (e.key === 'ArrowLeft') {
      if (detailOpen) {
        activeIndex = (activeIndex - 1 + JERSEYS.length) % JERSEYS.length;
        showingBack = false;
        lastSide = 'front';
        detailImg.style.transform = '';
        renderDetail(true);
      } else {
        prevBtn.click();
      }
    }
  });

  renderMenu();
  renderCarousel();
})();