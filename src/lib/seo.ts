import { SITE_URL, site, type CaseStudy } from "./site";

function personNode() {
  const p = site.person;
  return {
    "@type": "Person",
    "@id": `${SITE_URL}#person`,
    name: p.name,
    alternateName: p.alternateName,
    jobTitle: p.jobTitle,
    description: p.description,
    url: SITE_URL,
    image: `${SITE_URL}pedro-morago.jpg`,
    email: `mailto:${site.contact.email}`,
    address: { "@type": "PostalAddress", addressLocality: p.addressLocality, addressCountry: p.addressCountry },
    worksFor: { "@type": "Organization", name: p.worksFor },
    alumniOf: { "@type": "CollegeOrUniversity", name: p.alumniOf },
    knowsLanguage: p.knowsLanguage,
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      name: p.credential,
      credentialCategory: "certification",
    },
    knowsAbout: p.knowsAbout,
    // Derived from the visible contact links, so markup and page cannot disagree.
    sameAs: site.contact.links.map((l) => l.href),
  };
}

const website = { "@type": "WebSite", "@id": `${SITE_URL}#website`, url: SITE_URL, name: "Pedro Morago" };

export function homeJsonLd(title: string): string {
  return serialize([
    {
      ...website,
      alternateName: [site.person.name, "pedromorago.com"],
      inLanguage: site.htmlLang,
      publisher: { "@id": `${SITE_URL}#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}#profilepage`,
      url: SITE_URL,
      name: title,
      isPartOf: { "@id": `${SITE_URL}#website` },
      mainEntity: personNode(),
    },
  ]);
}

export function caseJsonLd(c: CaseStudy, url: string, image: string): string {
  // Minimal WebSite and Person nodes with the home page's @ids, so each page
  // validates on its own.
  return serialize([
    website,
    { "@type": "Person", "@id": `${SITE_URL}#person`, name: site.person.name, url: SITE_URL },
    {
      "@type": "TechArticle",
      "@id": `${url}#article`,
      headline: c.title,
      description: c.meta.description,
      url,
      mainEntityOfPage: url,
      image,
      inLanguage: site.htmlLang,
      author: { "@id": `${SITE_URL}#person` },
      publisher: { "@id": `${SITE_URL}#person` },
      isPartOf: { "@id": `${SITE_URL}#website` },
      about: c.meta.about.map((name) => ({ "@type": "Thing", name })),
    },
    {
      // The visible "Work" crumb is left out: /#work is the same URL as the
      // root for search engines.
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Pedro Morago", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: c.title, item: url },
      ],
    },
  ]);
}

// "<" is escaped so the JSON can never close the script element.
const serialize = (graph: unknown[]) =>
  JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
