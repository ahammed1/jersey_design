(function () {
  let activeIndex = 0;
  let searchQuery = '';
  let detailOpen = false;
  let isTransitioning = false;
  let showingBack = false;

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
  const detailLogoWrap = document.getElementById('detailLogoWrap');
  const detailBadge = document.getElementById('detailBadge');
  const detailLogoImg = document.getElementById('detailLogoImg');
  const detailMedia = document.getElementById('detailMedia');
  const detailImg = document.getElementById('detailImg');
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

    if (detailMedia && detailMedia.animate) {
      detailMedia.animate(
        [
          { opacity: 0.4, transform: 'translateY(16px) scale(0.95)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ],
        {
          duration: 420,
          easing: EASE_OUT_EXPO,
          fill: 'both'
        }
      );
    }
  }

  function renderDetail(animateSwitch = false) {
    const jersey = JERSEYS[activeIndex];
    detailPanel.style.background = jersey.detailGradient;
    detailBadge.textContent = jersey.badge;
    detailLogoImg.src = jersey.clips[0].image;
    detailLogoImg.alt = `${jersey.name} crest`;
    detailImg.src = jersey.backImage && showingBack ? jersey.backImage : jersey.image;
    detailImg.classList.toggle('is-back', showingBack);
    detailImg.alt = `${jersey.name}${showingBack ? ' — back side' : ' — front side'}`;
    detailTitle.textContent = jersey.name;
    detailSubtitle.hidden = false;
    detailSubtitle.innerHTML = `Club <strong>${jersey.club}</strong>`;
    detailDescription.textContent = jersey.description;

    // Render side rail
    railItems.innerHTML = '';
    JERSEYS.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rail-item' + (idx === activeIndex ? ' is-active' : '');
      btn.textContent = item.name;
      btn.addEventListener('click', () => {
        if (idx === activeIndex) return;
        activeIndex = idx;
        showingBack = false;
        lastSide = 'front';
        detailImg.style.transform = '';
        renderDetail(true);
      });
      railItems.appendChild(btn);
    });

    // Render detail clips
    clipsGrid.innerHTML = '';
    jersey.clips.forEach((clip) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'clip-card';
      btn.innerHTML = `
        <img src="${clip.image}" alt="${clip.title}" />
        <span class="clip-label">${clip.title}</span>
      `;
      btn.addEventListener('click', () => openLightbox(clip, jersey));
      clipsGrid.appendChild(btn);
    });

    if (animateSwitch) {
      animateDetailContentSwitch();
    }
  }

  function openDetail(index, sourceCard) {
    if (isTransitioning) return;

    const targetCard =
      sourceCard ||
      cardsTrack.querySelector(`.jersey-card[data-jersey-id="${JERSEYS[index].id}"]`);

    let cardRect = null;
    let imgRect = null;
    if (targetCard) {
      cardRect = targetCard.getBoundingClientRect();
      const imgEl = targetCard.querySelector('.jersey-card-img-wrap');
      if (imgEl) imgRect = imgEl.getBoundingClientRect();
    }

    activeIndex = index;
    showingBack = false;
    lastSide = 'front';
    detailImg.style.transform = '';
    detailOpen = true;

    // Keep carousel visible briefly beneath while morphing on desktop
    const useFlip = Boolean(cardRect && window.innerWidth > 900 && detailPanel.animate);

    if (useFlip) {
      isTransitioning = true;
      carouselView.style.opacity = '0';
      carouselView.style.pointerEvents = 'none';
    } else {
      carouselView.hidden = true;
    }

    detailView.hidden = false;
    renderDetail(false);

    if (useFlip) {
      const panelRect = detailPanel.getBoundingClientRect();
      const dx = cardRect.left - panelRect.left;
      const dy = cardRect.top - panelRect.top;
      const sx = cardRect.width / panelRect.width;
      const sy = cardRect.height / panelRect.height;

      // 1. Expand colored panel from card bounds
      const panelAnim = detailPanel.animate(
        [
          {
            transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
            borderRadius: '24px'
          },
          {
            transform: 'translate(0px, 0px) scale(1, 1)',
            borderRadius: '36px 0 0 0'
          }
        ],
        {
          duration: 540,
          easing: EASE_OUT_EXPO,
          fill: 'both'
        }
      );

      // 2. Glide & scale hero jersey from card image slot into overflowing top-left hero spot
      if (imgRect && detailMedia.animate) {
        const targetRect = detailMedia.getBoundingClientRect();
        const idx = imgRect.left - targetRect.left;
        const idy = imgRect.top - targetRect.top;
        const isx = imgRect.width / targetRect.width;
        const isy = imgRect.height / targetRect.height;

        detailMedia.animate(
          [
            {
              transform: `translate(${idx}px, ${idy}px) scale(${isx}, ${isy})`
            },
            {
              transform: 'translate(0px, 0px) scale(1, 1)'
            }
          ],
          {
            duration: 560,
            easing: EASE_OUT_EXPO,
            fill: 'both'
          }
        );
      }

      // 3. Staggered slide-up entrance for text, clips, crest badge, Close button & left rail
      const staggeredItems = [
        { el: detailTitle, delay: 110, y: 18, x: 0 },
        { el: detailSubtitle, delay: 150, y: 16, x: 0 },
        { el: detailDescription, delay: 195, y: 18, x: 0 },
        { el: clipsSection, delay: 245, y: 20, x: 0 },
        { el: detailLogoWrap, delay: 220, y: -10, x: 0 },
        { el: detailTopBar, delay: 140, y: -8, x: 0 },
        { el: detailRail, delay: 160, y: 0, x: -16 }
      ];

      staggeredItems.forEach(({ el, delay, y, x }) => {
        if (!el || !el.animate) return;
        el.animate(
          [
            { opacity: 0, transform: `translate(${x}px, ${y}px)` },
            { opacity: 1, transform: 'translate(0px, 0px)' }
          ],
          {
            duration: 440,
            delay,
            easing: EASE_OUT_EXPO,
            fill: 'both'
          }
        );
      });

      panelAnim.onfinish = () => {
        carouselView.hidden = true;
        carouselView.style.opacity = '';
        carouselView.style.pointerEvents = '';
        isTransitioning = false;
      };
    }
  }

  function closeDetail() {
    if (!detailOpen || isTransitioning) return;

    // Prepare carousel underneath to compute target card bounds
    carouselView.hidden = false;
    carouselView.style.opacity = '0';
    renderCarousel();

    const targetCard = cardsTrack.querySelector(
      `.jersey-card[data-jersey-id="${JERSEYS[activeIndex].id}"]`
    );

    if (targetCard && window.innerWidth > 900 && detailPanel.animate) {
      isTransitioning = true;
      const cardRect = targetCard.getBoundingClientRect();
      const panelRect = detailPanel.getBoundingClientRect();
      const dx = cardRect.left - panelRect.left;
      const dy = cardRect.top - panelRect.top;
      const sx = cardRect.width / panelRect.width;
      const sy = cardRect.height / panelRect.height;

      // Fade out text, crest, close button, and side rail first
      [detailTitle, detailSubtitle, detailDescription, clipsSection, detailLogoWrap, detailTopBar, detailRail].forEach(
        (el) => {
          if (!el || !el.animate) return;
          el.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 200,
            easing: 'ease-out',
            fill: 'both'
          });
        }
      );

      // Shrink hero jersey back to card image slot
      const imgEl = targetCard.querySelector('.jersey-card-img-wrap');
      if (imgEl && detailMedia.animate) {
        const imgRect = imgEl.getBoundingClientRect();
        const targetRect = detailMedia.getBoundingClientRect();
        const idx = imgRect.left - targetRect.left;
        const idy = imgRect.top - targetRect.top;
        const isx = imgRect.width / targetRect.width;
        const isy = imgRect.height / targetRect.height;

        detailMedia.animate(
          [
            { transform: 'translate(0px, 0px) scale(1, 1)' },
            { transform: `translate(${idx}px, ${idy}px) scale(${isx}, ${isy})` }
          ],
          {
            duration: 440,
            easing: EASE_OUT_EXPO,
            fill: 'both'
          }
        );
      }

      // Shrink colored panel back into the card slot
      const shrinkAnim = detailPanel.animate(
        [
          {
            transform: 'translate(0px, 0px) scale(1, 1)',
            borderRadius: '36px 0 0 0'
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
            borderRadius: '24px'
          }
        ],
        {
          duration: 440,
          easing: EASE_OUT_EXPO,
          fill: 'both'
        }
      );

      carouselView.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 320,
        delay: 140,
        easing: 'ease-out',
        fill: 'both'
      });

      shrinkAnim.onfinish = () => {
        detailOpen = false;
        detailView.hidden = true;
        carouselView.style.opacity = '';
        isTransitioning = false;
      };
    } else {
      detailOpen = false;
      detailView.hidden = true;
      carouselView.hidden = false;
      carouselView.style.opacity = '';
      renderCarousel();
    }
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
          showingBack = false;
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

  // Simple cursor-controlled jersey turn: move across the image to rotate.
  let lastSide = showingBack ? 'back' : 'front';

  function rotateJerseyWithPointer(event) {
    const jersey = JERSEYS[activeIndex];
    if (!jersey.backImage || !detailOpen || isTransitioning) return;

    const rect = detailMedia.getBoundingClientRect();
    const pointerX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const angle = pointerX * 180;
    const side = pointerX >= 0.5 ? 'back' : 'front';

    if (side !== lastSide && !isJerseyImageLoading) {
      const nextImage = side === 'back' ? jersey.backImage : jersey.image;
      const preload = new Image();
      isJerseyImageLoading = true;
      preload.onload = () => {
        showingBack = side === 'back';
        lastSide = side;
        detailImg.src = nextImage;
        detailImg.classList.toggle('is-back', showingBack);
        detailImg.alt = `${jersey.name}${showingBack ? ' — back side' : ' — front side'}`;
        isJerseyImageLoading = false;
      };
      preload.onerror = () => {
        isJerseyImageLoading = false;
      };
      preload.src = nextImage;
    }

    const visibleAngle = side === 'back' ? angle - 180 : angle;
    detailImg.style.transform = `perspective(1000px) rotateY(${visibleAngle}deg)`;
  }

  let isJerseyImageLoading = false;

  detailMedia.addEventListener('pointermove', rotateJerseyWithPointer);
  detailMedia.addEventListener('pointerleave', () => {
    detailImg.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
    detailImg.style.transform = 'perspective(1000px) rotateY(0deg)';
    window.setTimeout(() => {
      detailImg.style.transition = '';
      detailImg.style.transform = '';
    }, 280);
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