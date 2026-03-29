<template>
  <footer class="footer">
    <div class="footer__wrp container">
      <div class="footer__socials">
        
          v-for="social in visibleSocials"
          :key="social.name"
          :href="social.href"
          target="_blank"
          class="social-btn"
        ><a>
          <div class="social-btn__svg" v-html="social.icon" />
        </a>
      </div>

      <div class="footer__content">
        <div class="footer__links">
          
            v-for="link in visibleLinks"
            :key="link.label"
            :href="link.href"
            class="footer__link"
            :class="link.class"
          ><a>
            {{ link.label }}
          </a>
        </div>
        <p class="footer__disclaimer">
          This website and all its content belong exclusively to 0100 VC RAIF F.C.I.C. PLC.,
          with a registered office at 5 Esperidon Street 2001, Strovolos, Nicosia, Cyprus.
          <br />
          The Fund is only addressed to Well-Informed and/or Professional Investors (the "Eligible Investors").
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

const socials = [
  {
    name: 'linkedin',
    href: 'https://www.linkedin.com/company/zeroonehundred/',
    hidden: false,
    icon: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.45967 13.0516H0.882623V4.73377H3.45967V13.0516ZM2.17114 3.60044C1.34378 3.60044 0.675781 2.92998 0.675781 2.10296C0.675781 1.27593 1.34378 0.605469 2.17114 0.605469C2.99512 0.605469 3.66312 1.27593 3.66312 2.10296C3.66312 2.92657 2.99512 3.60044 2.17114 3.60044ZM13.1032 13.0516H10.5296V9.00842C10.5296 8.04526 10.5126 6.80303 9.1902 6.80303C7.85081 6.80303 7.64736 7.85467 7.64736 8.94035V13.0516H5.0771V4.73377H7.54564V5.8705H7.57955C7.92202 5.21705 8.76295 4.52616 10.0142 4.52616C12.6217 4.52616 13.1032 6.24827 13.1032 8.4877V13.0516Z" fill="currentColor"/>
    </svg>`,
  },
  {
    name: 'medium',
    href: '#',
    hidden: true,
    icon: `<svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5003 6.65968C13.5003 10.3352 10.5463 13.3147 6.90259 13.3147C3.25888 13.3147 0.304688 10.3345 0.304688 6.65968C0.304688 2.98485 3.25866 0.00439453 6.90259 0.00439453C10.5465 0.00439453 13.5003 2.98418 13.5003 6.65968Z" fill="currentColor"/>
      <path d="M20.7385 6.65972C20.7385 10.1194 19.2616 12.9252 17.4396 12.9252C15.6176 12.9252 14.1406 10.1194 14.1406 6.65972C14.1406 3.20003 15.6174 0.394287 17.4394 0.394287C19.2613 0.394287 20.7383 3.19914 20.7383 6.65972" fill="currentColor"/>
      <path d="M23.6992 6.65972C23.6992 9.75875 23.1798 12.2726 22.5389 12.2726C21.8981 12.2726 21.3789 9.75942 21.3789 6.65972C21.3789 3.56001 21.8983 1.04688 22.5389 1.04688C23.1796 1.04688 23.6992 3.55979 23.6992 6.65972Z" fill="currentColor"/>
    </svg>`,
  },
  {
    name: 'twitter',
    href: '#',
    hidden: true,
    icon: `<svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.8755 2.31497C15.3086 2.56665 14.6993 2.73614 14.0599 2.81254C14.7128 2.42155 15.2143 1.80199 15.4499 1.06365C14.8393 1.42576 14.1626 1.68899 13.4422 1.83088C12.8663 1.21645 12.0439 0.83252 11.1348 0.83252C9.09377 0.83252 7.59399 2.73678 8.05496 4.7136C5.42841 4.58198 3.09912 3.3236 1.53963 1.41099C0.711411 2.8318 1.11011 4.69048 2.51744 5.6317C1.99997 5.61501 1.51202 5.47312 1.08636 5.23621C1.05169 6.70068 2.10141 8.07078 3.62174 8.37574C3.17681 8.49645 2.68951 8.52469 2.19386 8.42967C2.59577 9.68549 3.76298 10.5991 5.1472 10.6248C3.8182 11.6668 2.14378 12.1323 0.466797 11.9345C1.86578 12.8314 3.528 13.3547 5.31285 13.3547C11.1823 13.3547 14.4984 8.39757 14.2981 3.95151C14.9157 3.5053 15.4518 2.94865 15.8755 2.31497Z" fill="currentColor"/>
    </svg>`,
  },
]

const links = [
  { label: 'Privacy policy', href: '/privacy-policy', class: 'footer__link--center', hidden: false },
  { label: 'Cookies policy', href: '/privacy-policy', class: 'footer__link--center', hidden: true },
  { label: 'Terms & conditions', href: '/privacy-policy', class: 'footer__link--right', hidden: true },
]

const visibleSocials = computed(() => socials.filter(s => !s.hidden))
const visibleLinks = computed(() => links.filter(l => !l.hidden))
</script>

<style scoped>
.footer {
  justify-content: center;
  align-items: flex-start;
  padding-top: 2.5rem;
  padding-bottom: 1.75rem;
  display: flex;
}
.footer__socials {
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 3.75rem;
  display: flex;
}
.social-btn {
  color: var(--main);
  background-color: transparent;
  border: 1px solid rgba(23, 22, 66, 0.1);
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  width: 3.125rem;
  height: 3.125rem;
  margin-right: 1rem;
  transition: all 0.3s;
  display: flex;
  text-decoration: none;
}
.social-btn:hover {
  border-color: var(--bright);
  color: var(--bright);
}
.social-btn__svg {
  justify-content: center;
  align-items: center;
  display: flex;
}
.footer__content {
  flex-direction: column;
  width: 100%;
  display: flex;
}
.footer__links {
  border-bottom: 1px solid rgba(23, 22, 66, 0.1);
  justify-content: center;
  align-items: center;
  padding-bottom: 1.25rem;
  display: flex;
}
.footer__link {
  color: var(--secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  min-width: 10rem;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 130%;
  text-decoration: none;
  transition: all 0.3s;
}
.footer__link:hover {
  color: var(--main);
}
.footer__link--center {
  text-align: center;
}
.footer__link--right {
  text-align: right;
}
.footer__disclaimer {
  color: var(--secondary);
  text-align: center;
  margin-top: 1.75rem;
  font-size: 0.6875rem;
  line-height: 150%;
}
</style>