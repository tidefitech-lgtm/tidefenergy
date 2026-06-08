/* PRELOADER & PAGE TRANSITION LOGIC */
    window.addEventListener('load', () => {
      const preloader = document.getElementById('preloader');
      setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
      }, 400); // Slight delay so the user actually sees the cool animation
    });

    // Intercept clicks for standard links to trigger loader
    document.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const target = this.getAttribute('target');
        
        // Ignore hash links, external tabs, or JS/mailto links
        if (!href || href.startsWith('#') || target === '_blank' || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        e.preventDefault(); 
        const preloader = document.getElementById('preloader');
        preloader.style.visibility = 'visible';
        preloader.style.opacity = '1';

        setTimeout(() => {
          window.location.href = href;
        }, 600); // Wait for the fade-in animation before navigating
      });
    });

    /* EXISTING SLIDER & INTERACTION LOGIC */
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const textContainer = document.getElementById('carouselTextContainer');
    const badgeSpan = document.getElementById('slideBadge');
    const titleSpan = document.getElementById('slideTitle');
    const descSpan = document.getElementById('slideDesc');
    const carouselData = [
      { badge: 'ROV & Subsea Specialists', title: 'Powering Offshore<br />Subsea Operations', desc: "Nigeria's premier ROV services company delivering world-class subsea manpower, equipment rental, maintenance, and training to the offshore energy sector." },
      { badge: 'Deep Water Intervention', title: 'Advanced Work-Class<br />ROV Systems', desc: 'Robotic engineering support for high-pressure inspection, subsea intervention, infrastructure monitoring, and marine project execution.' },
      { badge: 'Operational Readiness', title: 'Marine Logistics<br />& Rapid Response', desc: 'Responsive support and certified subsea operators prepared to improve technical asset uptime across offshore campaigns.' }
    ];
    let currentSlide = 0;
    let intervalId;

    function updateText(index) {
      textContainer.classList.remove('active-text');
      window.setTimeout(() => {
        const data = carouselData[index];
        badgeSpan.innerHTML = '<span class="h-1.5 w-1.5 rounded-full bg-tidef-cyan shadow-cyan"></span>' + data.badge;
        titleSpan.innerHTML = data.title;
        descSpan.textContent = data.desc;
        textContainer.classList.add('active-text');
      }, 150);
    }

    function showSlide(index) {
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
      dots.forEach((dot, i) => {
        dot.classList.toggle('bg-tidef-cyan', i === index);
        dot.classList.toggle('shadow-cyan', i === index);
        dot.classList.toggle('bg-white/20', i !== index);
      });
      currentSlide = index;
      updateText(index);
    }

    function startCarousel() {
      clearInterval(intervalId);
      intervalId = setInterval(() => showSlide((currentSlide + 1) % slides.length), 7000);
    }

    dots.forEach((dot, index) => dot.addEventListener('click', () => {
      showSlide(index);
      startCarousel();
    }));

    textContainer.classList.add('active-text');
    startCarousel();

    const depthFill = document.getElementById('depthFill');
    const depthVal = document.getElementById('depthVal');
    const nav = document.getElementById('navbar');
    const backTopBtn = document.getElementById('backTop');
    const navLinks = document.querySelectorAll('.nav-link');

    function handleScroll() {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const percent = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
      depthFill.style.width = percent + '%';
      depthVal.textContent = Math.floor(percent * 30) + 'm';
      nav.classList.toggle('bg-navy-950/85', scrollY > 60);
      nav.classList.toggle('backdrop-blur-2xl', scrollY > 60);
      nav.classList.toggle('shadow-panel', scrollY > 60);
      nav.classList.toggle('py-3', scrollY > 60);
      backTopBtn.classList.toggle('opacity-0', scrollY <= 500);
      backTopBtn.classList.toggle('translate-y-3', scrollY <= 500);

      document.querySelectorAll('main section[id]').forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionBottom = sectionTop + section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionBottom) {
          navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + section.id));
        }
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    backTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const statNums = document.querySelectorAll('.stat-num');
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.target);
        const suffix = target === 100 ? '<span class="text-tidef-cyan">%</span>' : '<span class="text-tidef-cyan">+</span>';
        let current = 0;
        const step = target / 36;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            el.innerHTML = target + suffix;
            clearInterval(timer);
          } else {
            el.innerHTML = Math.floor(current) + suffix;
          }
        }, 24);
        statsObserver.unobserve(el);
      });
    }, { threshold: 0.35 });
    statNums.forEach(num => statsObserver.observe(num));

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));

    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 56; i++) {
      const particle = document.createElement('span');
      const size = Math.random() * 2 + 1;
      particle.className = 'absolute rounded-full bg-tidef-cyan/40';
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animation = `floatParticles ${10 + Math.random() * 12}s infinite linear`;
      particle.style.animationDelay = `${Math.random() * -10}s`;
      particlesContainer.appendChild(particle);
    }

    const toggle = document.getElementById('navToggle');
    const navList = document.getElementById('navLinks');
    toggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('left-0');
      navList.classList.toggle('left-[-110%]', !isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.querySelector('i').classList.toggle('fa-bars', !isOpen);
      toggle.querySelector('i').classList.toggle('fa-xmark', isOpen);
    });
    navLinks.forEach(link => link.addEventListener('click', () => {
      navList.classList.remove('left-0');
      navList.classList.add('left-[-110%]');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('i').classList.add('fa-bars');
      toggle.querySelector('i').classList.remove('fa-xmark');
    }));

    document.getElementById('contactForm').addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Transmission successful. The TIDEF engineering desk will respond within 12 standard business hours.');
    });

    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('error', () => {
        img.src = 'https://images.pexels.com/photos/11286568/pexels-photo-11286568.jpeg?auto=compress&cs=tinysrgb&w=900';
      }, { once: true });
    });