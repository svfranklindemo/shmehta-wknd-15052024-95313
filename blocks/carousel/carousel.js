import { fetchPlaceholders } from '../../scripts/aem.js';


function parseTable(elTable) {

  // Initialize an object to hold parameter-value pairs
  var paramMap = {};

  // Loop through the table rows
  for (var i = 0, row; row = elTable.rows[i]; i++) {
    // Get the parameter name from the first column
    var paramName = row.cells[0].textContent.trim();
    // Get the parameter value from the second column
    var paramValue = row.cells[1].textContent.trim();

    // Store the parameter name and value in the paramMap object
    paramMap[paramName] = paramValue;
  }

  // Return a function that allows fetching values by parameter name
  return function(paramName) {
    return paramMap[paramName];
  };
}

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: [0.25] });
  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function contentSlide(row) {
  const slide = document.createElement('div');
  slide.className = 'slide-wrapper'
  slide.innerHTML = row.querySelector(":scope > td").innerHTML;
  const dataTable = slide.querySelector(':scope > table')

  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = 'content-wrapper'
  if(dataTable) {
    for (let column of Array.from(dataTable.querySelectorAll(":scope > tbody > tr > td"))) {
      const isImage = column.querySelector('picture');
      const isTable = column.querySelector('table');

      if(isImage) {
        const div = document.createElement('div');
        div.innerHTML = column.innerHTML;

        wrapperDiv.append(div);
        continue;
      }

      if(isTable) {
        const getParamValue = parseTable(isTable);
        const videoPath = getParamValue('video');
        const posterPath = getParamValue('poster');

        const div = document.createElement('div');
        div.innerHTML = column.innerHTML;

        const video = document.createElement('div');
        video.className = 'video-div';
        video.innerHTML = `<video
            controls=""
            disablepictureinpicture=""
            controlslist="nodownload noremoteplayback noplaybackrate"
            poster="${posterPath}"
            class="cmp-video__player"
            src="${videoPath}">
        </video>`;


        div.append(video);
        const removeElem = div.querySelector('table');
        div.insertBefore(video, removeElem);
        div.removeChild(removeElem);

        wrapperDiv.append(div);
      }

      slide.insertBefore(wrapperDiv, dataTable);
      slide.removeChild(dataTable);
    }
  }

  return slide;
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  const rootTable = row.querySelectorAll(':scope > div > table');

  if(rootTable && rootTable.length) {
    for (let elData of Array.from(rootTable[0].querySelectorAll(":scope > tbody > tr"))) {
      const isImage = elData.querySelector(':scope > td > picture');
      if(isImage) {
        const bgImage = isImage?.querySelector('img')?.getAttribute('src');
        // Set the background image using the style property
        slide.style.backgroundImage = `url("${bgImage}")`;

        // Optionally, set other background properties to ensure it displays correctly
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundRepeat = 'no-repeat';
        slide.style.backgroundPosition = 'center';
        continue;
      }

      const content = contentSlide(elData);
      slide.append(content);
    }
  }

  /*row.querySelectorAll(':scope > div').forEach((column) => {
    const isImage = column.querySelector('picture');
    column.classList.add(`carousel-slide-${isImage ? 'image' : 'content'}`);
    slide.append(column);

    if (!isImage) {
      const link = column.querySelector('.button-container > a');
      link.classList.remove('button');
      link.classList.add('button-primary');
    }
  });*/

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button"><span>${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}</span></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
