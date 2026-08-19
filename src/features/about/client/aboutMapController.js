import {
  getMapRetryDelayMs,
  getPlaceTypeLabel,
  parsePlacesDataset,
  shouldRetryMapInit,
} from "../utils/aboutMap.js";

export function createAboutMapController({
  leaflet,
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
  consoleRef = globalThis.console,
} = {}) {
  if (!leaflet) {
    throw new TypeError("The About map controller requires a Leaflet adapter");
  }

  let lifecycleController = new AbortController();
  let started = false;

  const getLifecycleSignal = () => {
    if (lifecycleController.signal.aborted) {
      lifecycleController = new AbortController();
    }
    return lifecycleController.signal;
  };

  const scheduleTimeout = (callback, delay) => {
    const signal = getLifecycleSignal();
    const timeoutId = setTimeoutFn(callback, delay);
    signal.addEventListener("abort", () => clearTimeoutFn(timeoutId), { once: true });
    return timeoutId;
  };

  const markerIcon = (placeType, selected = false) =>
    leaflet.divIcon({
      className: "",
      html: `<span class="about-map-marker about-map-marker--${placeType}${selected ? " is-selected" : ""}"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -12],
    });

  const popupMarkup = (place) =>
    `<div class="about-map-popup">
      <img src="${place.image}" alt="Photo placeholder for ${place.title}" loading="lazy" />
      <div>
        <p class="about-map-popup__tag">${getPlaceTypeLabel(place.type)}</p>
        <h3>${place.title}</h3>
        <p>${place.location}</p>
        ${place.type !== "travel" && place.period ? `<p>${place.period}</p>` : ""}
        ${place.type !== "travel" ? `<p>${place.description}</p>` : ""}
        ${place.link ? `<p><a href="${place.link}" target="_blank" rel="noopener noreferrer">Airbus Geo Explore Early Testing Programme</a></p>` : ""}
      </div>
    </div>`;

  const popupMaxWidth = () => {
    if (!windowRef) return 280;
    return Math.min(280, Math.max(196, windowRef.innerWidth - 68));
  };

  const popupPanPadding = () => {
    const padding = windowRef && windowRef.innerWidth <= 520 ? 14 : 22;
    return leaflet.point(padding, padding);
  };

  const init = (root) => {
    if (!root) return;
    if (root.dataset.mapInitState === "ready" || root.dataset.mapInitState === "loading") return;
    root.dataset.mapInitState = "loading";

    const mapElement = root.querySelector("[data-map-canvas]");
    const filterButtons = Array.from(root.querySelectorAll("[data-filter]"));
    const cardButtons = Array.from(root.querySelectorAll("[data-place-id]"));
    const cardsViewport = root.querySelector("[data-cards-viewport]");
    const cardsPrev = root.querySelector("[data-cards-prev]");
    const cardsNext = root.querySelector("[data-cards-next]");
    const mapPlaces = parsePlacesDataset(root.dataset.places);

    if (
      !mapElement ||
      filterButtons.length === 0 ||
      cardButtons.length === 0 ||
      mapPlaces.length === 0
    ) {
      root.dataset.mapInitState = "idle";
      return;
    }

    const signal = getLifecycleSignal();

    if (mapElement.classList.contains("leaflet-container")) {
      mapElement.innerHTML = "";
      mapElement.classList.remove("leaflet-container");
    }

    const updateCardsNav = () => {
      if (!cardsViewport || !cardsPrev || !cardsNext) return;
      const maxScrollLeft = cardsViewport.scrollWidth - cardsViewport.clientWidth;
      const canScroll = maxScrollLeft > 2;
      root.dataset.cardsScrollable = canScroll ? "true" : "false";
      cardsPrev.disabled = !canScroll || cardsViewport.scrollLeft <= 2;
      cardsNext.disabled = !canScroll || cardsViewport.scrollLeft >= maxScrollLeft - 2;
    };

    const scrollCards = (direction) => {
      if (!cardsViewport) return;
      cardsViewport.scrollBy({
        left: direction * cardsViewport.clientWidth,
        behavior: "smooth",
      });
    };

    if (root.dataset.mapUiBindings !== "true") {
      cardsPrev?.addEventListener(
        "click",
        () => {
          scrollCards(-1);
        },
        { signal }
      );

      cardsNext?.addEventListener(
        "click",
        () => {
          scrollCards(1);
        },
        { signal }
      );

      cardsViewport?.addEventListener(
        "scroll",
        () => {
          updateCardsNav();
        },
        { signal }
      );

      windowRef?.addEventListener("resize", updateCardsNav, { signal });

      root.dataset.mapUiBindings = "true";
    }

    let activeMap = null;
    const removeMap = () => {
      if (!activeMap) return;
      activeMap.remove();
      activeMap = null;
    };

    signal.addEventListener("abort", removeMap, { once: true });

    try {
      const map = leaflet
        .map(mapElement, {
          zoomControl: false,
          worldCopyJump: true,
        })
        .setView([23, 4], 2);
      activeMap = map;

      leaflet.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        })
        .addTo(map);

      const markersById = new Map();
      let activeFilter = "all";
      let activePlaceId = null;

      const applyPopupViewportOptions = (popup) => {
        if (!popup) return;
        popup.options.maxWidth = popupMaxWidth();
        popup.options.autoPanPaddingTopLeft = popupPanPadding();
        popup.options.autoPanPaddingBottomRight = popupPanPadding();
      };

      const openPopupFromCardSelection = (marker) => {
        if (!map.hasLayer(marker)) return;
        const popup = marker.getPopup();
        if (!popup) {
          marker.openPopup();
          return;
        }

        applyPopupViewportOptions(popup);
        const { autoPan, keepInView } = popup.options;
        popup.options.autoPan = false;
        popup.options.keepInView = false;
        marker.openPopup();
        popup.options.autoPan = autoPan;
        popup.options.keepInView = keepInView;
      };

      const getCardSelectionCenter = (place, targetZoom) => {
        const isMobile = Boolean(windowRef && windowRef.innerWidth <= 520);
        const mapHeight = mapElement.clientHeight || 0;
        const verticalOffset = Math.round(
          Math.min(
            isMobile ? 120 : 96,
            Math.max(isMobile ? 72 : 56, mapHeight * (isMobile ? 0.24 : 0.18))
          )
        );
        const projected = map
          .project([place.lat, place.lng], targetZoom)
          .subtract([0, verticalOffset]);
        return map.unproject(projected, targetZoom);
      };

      const highlight = (placeId) => {
        activePlaceId = placeId;
        mapPlaces.forEach((place) => {
          const marker = markersById.get(place.id);
          if (!marker) return;
          marker.setIcon(markerIcon(place.type, place.id === placeId));
        });
        cardButtons.forEach((card) => {
          card.dataset.active = card.dataset.placeId === placeId ? "true" : "false";
        });

        const activeCard = cardButtons.find((card) => card.dataset.placeId === placeId);
        if (activeCard && activeCard.dataset.hidden !== "true") {
          activeCard.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      };

      mapPlaces.forEach((place) => {
        const marker = leaflet
          .marker([place.lat, place.lng], {
            icon: markerIcon(place.type),
            riseOnHover: true,
          })
          .bindPopup(popupMarkup(place), {
            className: "about-map-leaflet-popup",
            maxWidth: popupMaxWidth(),
            keepInView: true,
            autoPanPaddingTopLeft: popupPanPadding(),
            autoPanPaddingBottomRight: popupPanPadding(),
          })
          .addTo(map);

        marker.on("click", () => {
          highlight(place.id);
        });

        marker.on("popupopen", () => {
          highlight(place.id);
        });

        markersById.set(place.id, marker);
      });

      const updateVisibility = () => {
        const visiblePositions = [];

        mapPlaces.forEach((place) => {
          const isVisible = activeFilter === "all" || place.type === activeFilter;
          const marker = markersById.get(place.id);
          const card = root.querySelector(`[data-place-id="${place.id}"]`);

          if (card) {
            card.dataset.hidden = isVisible ? "false" : "true";
          }

          if (!marker) return;
          if (isVisible) {
            marker.addTo(map);
            visiblePositions.push([place.lat, place.lng]);
          } else {
            map.removeLayer(marker);
          }
        });

        if (visiblePositions.length > 0) {
          const bounds = leaflet.latLngBounds(visiblePositions);
          map.fitBounds(bounds, { padding: [42, 42], maxZoom: 4 });
        }

        if (cardsViewport) {
          cardsViewport.scrollLeft = 0;
        }
        updateCardsNav();

        const selectedStillVisible = mapPlaces.some(
          (place) =>
            place.id === activePlaceId && (activeFilter === "all" || place.type === activeFilter)
        );
        if (!selectedStillVisible) {
          activePlaceId = null;
          cardButtons.forEach((card) => {
            card.dataset.active = "false";
          });
        }
      };

      filterButtons.forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const filter = button.dataset.filter;
            if (!filter) return;
            activeFilter = filter;
            filterButtons.forEach((filterButton) => {
              filterButton.dataset.active = filterButton === button ? "true" : "false";
            });
            updateVisibility();
          },
          { signal }
        );
      });

      cardButtons.forEach((card) => {
        card.addEventListener(
          "click",
          () => {
            const placeId = card.dataset.placeId;
            if (!placeId || card.dataset.hidden === "true") return;
            const place = mapPlaces.find((item) => item.id === placeId);
            const marker = markersById.get(placeId);
            if (!place || !marker) return;
            highlight(placeId);

            const targetId = placeId;
            const targetZoom = Math.max(map.getZoom(), 4);
            const targetCenter = getCardSelectionCenter(place, targetZoom);
            const shouldMove =
              Math.abs(map.getZoom() - targetZoom) > 0.01 ||
              map.getCenter().distanceTo(targetCenter) > 18;

            const revealPopup = () => {
              if (activePlaceId !== targetId) return;
              openPopupFromCardSelection(marker);
            };

            if (!shouldMove) {
              revealPopup();
              return;
            }

            map.stop();
            map.closePopup();

            let fallbackTimer = null;
            const onMoveEnd = () => {
              if (fallbackTimer) {
                clearTimeoutFn(fallbackTimer);
                fallbackTimer = null;
              }
              revealPopup();
            };

            map.once("moveend", onMoveEnd);
            map.flyTo(targetCenter, targetZoom, { duration: 0.72, easeLinearity: 0.25 });
            fallbackTimer = scheduleTimeout(() => {
              map.off("moveend", onMoveEnd);
              revealPopup();
            }, 900);
          },
          { signal }
        );
      });

      updateVisibility();

      scheduleTimeout(() => {
        map.invalidateSize();
        updateCardsNav();
      }, 80);

      scheduleTimeout(() => {
        map.invalidateSize();
      }, 400);

      root.dataset.mapInitState = "ready";
      root.dataset.mapRetryCount = "0";
    } catch (error) {
      removeMap();
      signal.removeEventListener("abort", removeMap);
      root.dataset.mapInitState = "idle";
      throw error;
    }
  };

  const setup = () => {
    documentRef?.querySelectorAll("[data-about-map-root]").forEach((root) => {
      init(root);
    });
  };

  const setupWithRetry = () => {
    documentRef?.querySelectorAll("[data-about-map-root]").forEach((root) => {
      try {
        init(root);
      } catch (error) {
        consoleRef?.error?.("Failed to initialize About map demo", error);
        const retries = Number(root.dataset.mapRetryCount ?? "0");
        if (!shouldRetryMapInit(retries)) return;
        const nextAttempt = retries + 1;
        root.dataset.mapRetryCount = String(nextAttempt);
        scheduleTimeout(() => {
          try {
            init(root);
          } catch {
            // Follow-up retries are handled by subsequent setup calls or next retry cycle.
          }
        }, getMapRetryDelayMs(nextAttempt));
      }
    });
  };

  const cleanup = () => {
    lifecycleController.abort();
  };

  const start = () => {
    if (started || !documentRef) return;
    started = true;

    if (documentRef.readyState === "loading") {
      documentRef.addEventListener("DOMContentLoaded", setupWithRetry, { once: true });
    } else {
      setupWithRetry();
    }

    documentRef.addEventListener("astro:before-swap", cleanup);
    documentRef.addEventListener("astro:page-load", setupWithRetry);
    documentRef.addEventListener("astro:after-swap", setup);
  };

  return { cleanup, setup, setupWithRetry, start };
}

export function startAboutMap(leaflet, options = {}) {
  const controller = createAboutMapController({ leaflet, ...options });
  controller.start();
  return controller.cleanup;
}
