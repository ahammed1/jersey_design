(function () {
  let activeIndex = 0;
  let searchQuery = '';
  let detailOpen = false;
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
    detailImg.src = jersey.backImage && showingBack ? jersey.backImage : jersey.image;
    detailImg.classList.toggle('is-back', showingBack);
    detailImg.alt = `${jersey.name}${showingBack ? ' — back side' : ' — front side'}`;
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
        showingBack = false;
        renderDetail();
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
    showingBack = false;
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

  // Click and drag across the jersey to rotate it between front and back.
  let dragPointerId = null;
  let lastPointerX = 0;
  let dragRotation = 0;
  let isDraggingJersey = false;
  let isTurning = false;

  detailMedia.addEventListener('pointerdown', (event) => {
    if (!JERSEYS[activeIndex].backImage || isTurning) return;
    dragPointerId = event.pointerId;
    lastPointerX = event.clientX;
    dragRotation = 0;
    isDraggingJersey = true;
    detailMedia.setPointerCapture(event.pointerId);
    detailMedia.classList.add('is-dragging');
    detailImg.style.transition = 'none';
  });

  detailMedia.addEventListener('pointermove', async (event) => {
    if (dragPointerId !== event.pointerId || !isDraggingJersey || isTurning) return;

    const movement = event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    dragRotation += movement * 0.9;

    if (dragRotation >= 90 || dragRotation <= -90) {
      const jersey = JERSEYS[activeIndex];
      const nextShowingBack = !showingBack;
      const nextImage = nextShowingBack ? jersey.backImage : jersey.image;
      const preload = new Image();
      isTurning = true;

      try {
        await new Promise((resolve, reject) => {
          preload.onload = resolve;
          preload.onerror = reject;
          preload.src = nextImage;
        });
        showingBack = nextShowingBack;
        detailImg.src = nextImage;
        detailImg.classList.toggle('is-back', showingBack);
        detailImg.alt = `${jersey.name}${showingBack ? ' — back side' : ' — front side'}`;
        dragRotation = dragRotation > 0 ? -90 : 90;
      } catch (error) {
        showToast('Unable to load this jersey image. Check the image file path.');
        isDraggingJersey = false;
      } finally {
        isTurning = false;
      }
    }

    const angle = Math.max(-88, Math.min(88, dragRotation));
    detailImg.style.transform = `perspective(1000px) rotateY(${angle}deg)`;
  });

  function finishJerseyDrag(event) {
    if (dragPointerId !== event.pointerId) return;
    dragPointerId = null;
    isDraggingJersey = false;
    detailMedia.classList.remove('is-dragging');

    const shouldSettleOnBack = Math.abs(dragRotation) > 35;
    if (shouldSettleOnBack && !showingBack && JERSEYS[activeIndex].backImage) {
      // A short final turn completes the drag to the reverse side.
      const jersey = JERSEYS[activeIndex];
      const preload = new Image();
      isTurning = true;
      preload.onload = () => {
        detailImg.animate(
          [
            { transform: detailImg.style.transform || 'rotateY(0deg)', opacity: 1 },
            { transform: 'perspective(1000px) rotateY(90deg)', opacity: 0.2 }
          ],
          { duration: 140, easing: 'ease-in', fill: 'forwards' }
        ).finished.then(() => {
          showingBack = true;
          detailImg.src = jersey.backImage;
          detailImg.classList.add('is-back');
          detailImg.alt = `${jersey.name} — back side`;
          detailImg.animate(
            [
              { transform: 'perspective(1000px) rotateY(-90deg)', opacity: 0.2 },
              { transform: 'perspective(1000px) rotateY(0deg)', opacity: 1 }
            ],
            { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
          );
        }).finally(() => {
          detailImg.style.transform = '';
          isTurning = false;
        });
      };
      preload.onerror = () => {
        isTurning = false;
        detailImg.style.transform = '';
      };
      preload.src = jersey.backImage;
    } else {
      detailImg.animate(
        [
          { transform: detailImg.style.transform || 'rotateY(0deg)' },
          { transform: 'perspective(1000px) rotateY(0deg)' }
        ],
        { duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
      ).onfinish = () => {
        detailImg.style.transform = '';
      };
    }
  }

  detailMedia.addEventListener('pointerup', finishJerseyDrag);
  detailMedia.addEventListener('pointercancel', finishJerseyDrag);

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
