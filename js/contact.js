/* PRELOADER LOGIC */
    window.addEventListener('load', () => {
      const preloader = document.getElementById('preloader');
      setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
      }, 400); 
    });

    // Intercept clicks for standard links to trigger loader
    document.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const target = this.getAttribute('target');
        if (!href || href.startsWith('#') || target === '_blank' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        e.preventDefault(); 
        const preloader = document.getElementById('preloader');
        preloader.style.visibility = 'visible';
        preloader.style.opacity = '1';
        setTimeout(() => { window.location.href = href; }, 600); 
      });
    });

    /* SCROLL & ANIMATION LOGIC */
    const nav = document.getElementById('navbar');
    const backTopBtn = document.getElementById('backTop');

    function handleScroll() {
      const scrollY = window.scrollY;
      nav.classList.toggle('bg-navy-950/85', scrollY > 60);
      nav.classList.toggle('backdrop-blur-2xl', scrollY > 60);
      nav.classList.toggle('shadow-panel', scrollY > 60);
      nav.classList.toggle('py-3', scrollY > 60);
      backTopBtn.classList.toggle('opacity-0', scrollY <= 500);
      backTopBtn.classList.toggle('translate-y-3', scrollY <= 500);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    backTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up').forEach(el => revealObserver.observe(el));

    /* MOBILE NAV TOGGLE */
    const toggle = document.getElementById('navToggle');
    const navList = document.getElementById('navLinks');
    toggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('left-0');
      navList.classList.toggle('left-[-110%]', !isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.querySelector('i').classList.toggle('fa-bars', !isOpen);
      toggle.querySelector('i').classList.toggle('fa-xmark', isOpen);
    });

    /* CONTACT FORM SUBMISSION */
    document.getElementById('mainContactForm').addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Message sent successfully! The TIDEF engineering desk will respond shortly.');
      event.target.reset(); // Clear form after submission
    });