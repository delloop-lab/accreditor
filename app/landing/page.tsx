"use client";
import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import './styles.css';

// Version number - increment by 0.010 for each change
const VERSION = "0.9950";

export default function LandingPage() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const backToTopRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Countdown timer
    const targetDate = new Date('2026-01-30T00:00:00').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Scroll to top button
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Smooth scroll for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) {
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGetStarted = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector('#get-started');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Montserrat:wght@400;600;700;800&family=Roboto:wght@300;400;500;700;900&display=swap');
        * {
          box-sizing: border-box;
        }
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }
      `}</style>
      
      {/* Countdown Banner */}
      <section className="countdown-banner">
        <div className="container">
          <div className="countdown-banner-content">
            <p className="countdown-banner-text">Sign up now and use it for free until 30th January 2026.</p>
            <div className="countdown" id="countdown">
              <div className="countdown-item">
                <span className="countdown-number">{countdown.days}</span>
                <span className="countdown-label">DAYS</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{countdown.hours}</span>
                <span className="countdown-label">HOURS</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{countdown.minutes}</span>
                <span className="countdown-label">MINUTES</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{countdown.seconds}</span>
                <span className="countdown-label">SECONDS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-logo">
            <img src="/icfLOGO4.png" alt="ICF Log" className="logo-img" />
          </div>
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">The easier way to stay on top of your ICF hours.</h1>
              <p className="hero-description">Log sessions, track CPD and prep for renewal without the admin headache. Your coaching practice just got smoother.</p>
              <div className="hero-cta">
                <a href="#get-started" onClick={handleGetStarted} className="btn btn-large btn-hero">Start Your Log</a>
              </div>
              <p className="hero-tagline">Ditch the spreadsheet. Keep the clarity.</p>
            </div>
            <div className="hero-image">
              <img src="/landing2-images/hero-mobile.png" alt="ICF Log Mobile App" className="hero-img-mobile" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <p className="section-label">Designed for ICF members & credentialed coaches</p>
          <h2 className="section-title">Your simple, dedicated dashboard to stay ICF compliant.</h2>
          <p className="section-description">ICF Log is an online dashboard designed specifically for ICF credentialed coaches and those working towards ACC, PCC, or MCC. It is built around the International Coaching Federation credentialing requirements. ICF Log gives a home for everything you need to track.</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="feature-grid">
            <div className="feature-card feature-card-green">
              <div className="feature-icon-wrapper feature-icon-white-circle">
                <div className="feature-icon">👤</div>
              </div>
              <h3 className="feature-title">Client Management</h3>
              <p className="feature-text">Log coaching sessions quickly and accurately.</p>
            </div>
            <div className="feature-card feature-card-blue">
              <div className="feature-icon-wrapper feature-icon-white-circle">
                <div className="feature-icon">📅</div>
              </div>
              <h3 className="feature-title">Track ICF CCEs</h3>
              <p className="feature-text">Track CPD activities in one tidy place.</p>
            </div>
            <div className="feature-card feature-card-light-green">
              <div className="feature-icon-wrapper feature-icon-white-circle">
                <div className="feature-icon">💲</div>
              </div>
              <h3 className="feature-title">Stay Compliant</h3>
              <p className="feature-text">Generate evidence to support your next ICF renewal.</p>
            </div>
          </div>
          <p className="features-tagline">No drama. No giant learning curve. Just a clear, coach friendly log that quietly has your back.</p>
        </div>
      </section>

      {/* Feature Detail 1 */}
      <section className="feature-detail">
        <div className="container">
          <div className="feature-detail-content">
            <div className="feature-detail-image">
              <img src="/landing2-images/dashboard-cards.png" alt="Dashboard Cards" className="detail-img" />
            </div>
            <div className="feature-detail-text">
              <h2 className="feature-detail-title">Easily record client sessions, Mentoring & Supervision, and CPD activity.</h2>
              <p className="feature-detail-paragraph">Input all the details you need for ICF compliance, including date, duration & client data.</p>
              <p className="feature-detail-paragraph">No more guessing how many hours you have done or where that information is stored. Document your professional learning and development in one place.</p>
              <p className="feature-detail-paragraph">See your growth at a glance, not buried in your inbox.</p>
              <a href="#get-started" onClick={handleGetStarted} className="btn btn-feature-detail">Get ICF Log</a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Detail 2 */}
      <section className="feature-detail feature-detail-reverse">
        <div className="container">
          <div className="feature-detail-content">
            <div className="feature-detail-image">
              <img src="/landing2-images/sessions-log.png" alt="Sessions Log" className="detail-img" />
            </div>
            <div className="feature-detail-text">
              <h2 className="section-title">Accreditation Documentation</h2>
              <p className="section-description">When renewal time comes, you shouldn't start from scratch. ICF Log allows you to:</p>
              <p className="feature-detail-paragraph">Generate a professional summary of your coaching hours, CCEs, and Mentoring & Supervision</p>
              <p className="feature-detail-paragraph">Export information to support your ICF credential renewal</p>
              <p className="feature-detail-paragraph">You can even start by uploading your current spreadsheet log.</p>
              <p className="section-description">ICF Log brings the organised structure you're craving.</p>
              <a href="#get-started" onClick={handleGetStarted} className="btn btn-primary">Get ICF Log</a>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Detail 3 */}
      <section className="feature-detail">
        <div className="container">
          <div className="feature-detail-content">
            <div className="feature-detail-image">
              <img src="/landing2-images/progress-tacking.png" alt="Progress Tracking" className="detail-img" />
            </div>
            <div className="feature-detail-text">
              <h2 className="section-title">Automated Reminders</h2>
              <p className="section-description">Life is full. Coaching is busy. Logging can slip. ICF Log sends gentle reminders to</p>
              <ul className="feature-list">
                <li>Log recent sessions</li>
                <li>Update CPD activities</li>
                <li>Stay on track well before deadlines</li>
              </ul>
              <p className="section-description">Not nagging. Just a calm <em>"you have got this, here is what is next"</em> nudge.</p>
              <a href="#get-started" onClick={handleGetStarted} className="btn btn-primary">Get ICF Log</a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="why-choose">
        <div className="container">
          <h2 className="section-title">Why coaches choose ICF Log</h2>
          <p className="section-description">You do not need a complicated system with 50 features you will never use.</p>
          <p className="section-description">You need something simple, focused and built around ICF credentialing requirements.</p>
          
          <div className="why-grid">
            <div className="why-card">
              <h3 className="why-title">Designed to support coaches</h3>
              <ul className="why-list">
                <li>Struggling to fit admin around clients, life and everything else</li>
                <li>Feeling the emotional weight of renewal and credential status</li>
                <li>With the desire to stay professional without adding more mental load</li>
              </ul>
            </div>
            <div className="why-card">
              <h3 className="why-title">Perfect for Coaches who</h3>
              <ul className="why-list">
                <li>Are logging hours for ACC, PCC or MCC credentials and want a calmer process</li>
                <li>Are running a coaching business and ready to grow up from scattered notes</li>
                <li>want admin to support their practice, not drain it</li>
              </ul>
            </div>
          </div>
          <p className="why-tagline">If "I will sort my hours next month" is a regular thought, this is for you.</p>
          <p className="section-description">ICF Log keeps things clear, practical, and coach-centred. Meaning you can spend more time coaching and less time hunting for that "ICF hours" spreadsheet.</p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="container">
          <h2 className="section-title">Simple Pricing. No hidden tricks</h2>
          <p className="section-description">Every plan comes with a no-questions-asked 14-day money-back guarantee. Meaning you can try ICF Log risk-free.</p>
          
          <div className="pricing-grid">
            <div className="pricing-card pricing-card-featured">
              <div className="pricing-badge">Best value if you are in this for the long run.</div>
              <h3 className="pricing-title">Pay Yearly</h3>
              <div className="pricing-price">
                <span className="price-amount">$75</span>
                <span className="price-period">/year</span>
              </div>
              <p className="pricing-note">*Launch offer (usually $120)</p>
              <ul className="pricing-features">
                <li>Full access to the ICF Log</li>
                <li>Unlimited session logging</li>
                <li>Unlimited CPD tracking</li>
                <li>Unlimited mentoring & supervision logging</li>
                <li>Document import & export</li>
                <li>Calendly Integration (more coming soon)</li>
                <li>Automated reminders</li>
                <li>Become an affiliate- earn $ for referring</li>
                <li>Priority tech support</li>
                <li>First access to new features</li>
                <li>Pay once, relax for the year</li>
                <li>Save compared to paying monthly</li>
                <li>Lock in at this price for life</li>
              </ul>
              <a href="#get-started" onClick={handleGetStarted} className="btn btn-primary btn-block">Grab the launch offer</a>
            </div>
            
            <div className="pricing-card">
              <div className="pricing-badge">If you want more flexibility.</div>
              <h3 className="pricing-title">Pay 6-monthly</h3>
              <div className="pricing-price">
                <span className="price-amount">$60</span>
                <span className="price-period">/six months</span>
              </div>
              <ul className="pricing-features">
                <li>Full access to the ICF Log</li>
                <li>Unlimited session logging</li>
                <li>Unlimited CPD tracking</li>
                <li>Unlimited mentoring & supervision logging</li>
                <li>Document import & export</li>
                <li>Calendly Integration (more coming soon)</li>
                <li>Automated reminders</li>
                <li>Become an affiliate- earn $ for referring</li>
                <li>Priority tech support</li>
                <li>First access to new features</li>
                <li>Pay once, relax for the year</li>
                <li>Save compared to paying monthly</li>
                <li>Lock in at this price for life</li>
              </ul>
              <a href="#get-started" onClick={handleGetStarted} className="btn btn-outline btn-block">Sign me up</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq">
        <div className="container">
          <p className="faq-label">FREQUENTLY ASKED QUESTIONS</p>
          <h2 className="faq-heading">We've got A's for your Q's</h2>
          
          <div className="faq-grid">
            <div className="faq-item">
              <h3 className="faq-question">Is this official ICF software?</h3>
              <p className="faq-answer">No. ICF Log is an independently developed tool for coaches. It is designed to support you with ICF style logging and documentation, but it is not affiliated with or endorsed by the International Coaching Federation.</p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Do I need to be very tech savvy to use it?</h3>
              <p className="faq-answer">No. If you can fill in a simple form and click a button, you will be fine. The whole point is to reduce complexity, not add to it.</p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Will this guarantee my credential is renewed?</h3>
              <p className="faq-answer">ICF Log cannot guarantee ICF decisions, but it can help you present a clear, accurate record of your hours and CPD so you are properly prepared. You can export your data and always have access to your own records.</p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Is my data secure?</h3>
              <p className="faq-answer">ICF Log uses standard security practices to help protect your information. You remain in control of your data.</p>
            </div>
          </div>
          <div className="faq-cta">
            <a href="#get-started" onClick={handleGetStarted} className="btn btn-faq">Get ICF Log Today</a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">Coaches love ICF Log</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card testimonial-card-1">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">The only tool you'll need for managing ICF credentialling! And it integrated with my Calendly which is a lifesaver.</p>
              <div className="testimonial-footer">
                <span className="testimonial-name">Gemma</span>
                <img src="/landing2-images/gemma.png" alt="Gemma" className="testimonial-avatar" />
              </div>
            </div>
            <div className="testimonial-card testimonial-card-2">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">Finally, an alternative to that clunky ICF Spreadsheet. The dashboard is amazing.</p>
              <div className="testimonial-footer">
                <span className="testimonial-name">Tom</span>
                <img src="/landing2-images/tom.png" alt="Tom" className="testimonial-avatar" />
              </div>
            </div>
            <div className="testimonial-card testimonial-card-3">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">This Dashboard makes it so much easier to track my coaching hours, plus now I know how many CCEs I need.</p>
              <div className="testimonial-footer">
                <span className="testimonial-name">Maggie</span>
                <img src="/landing2-images/maggfie.png" alt="Maggie" className="testimonial-avatar" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="cta">
        <div className="container">
          <div className="cta-content">
            <div className="cta-left">
              <h2 className="cta-title">Ready to Unlock Free Access to the ICF Log?</h2>
              <p className="cta-subtitle">Sign up now and use for free until 30th January 2026.</p>
              <div className="countdown countdown-small" id="countdown2">
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.days}</span>
                  <span className="countdown-label">DAYS</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.hours}</span>
                  <span className="countdown-label">HOURS</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.minutes}</span>
                  <span className="countdown-label">MINUTES</span>
                </div>
                <div className="countdown-item">
                  <span className="countdown-number">{countdown.seconds}</span>
                  <span className="countdown-label">SECONDS</span>
                </div>
              </div>
              <Link href="/register" className="btn btn-large btn-cta">Get the ICF Log Today</Link>
            </div>
            <div className="cta-right">
              <img src="/landing2-images/progress-tracking.png" alt="Progress Tracking" className="cta-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="/icfLOGO4.png" alt="ICF Log" className="logo-img" />
            </div>
            <div className="footer-text-row">
              <p className="footer-text">©2025 ICF Log. Supporting professional coaches worldwide. Independent development - Not affiliated with the International Coaching Federation (ICF).</p>
            </div>
            <div className="footer-links">
              <Link href="/terms" className="footer-link">Terms and Conditions</Link>
              <Link href="/faq" className="footer-link">FAQ</Link>
              <Link href="/disclaimer" className="footer-link">Disclaimer</Link>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
            </div>
            <div className="footer-version">
              <span className="version-text">Beta V{VERSION}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button 
        ref={backToTopRef}
        id="backToTop" 
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        ↑
      </button>
    </>
  );
}
