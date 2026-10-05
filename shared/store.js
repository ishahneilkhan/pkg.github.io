/* Website Deals — shared/store.js
   Central data layer for:
   - admin/websites.html
   - admin/dashboard.html
   - admin/settings.html
   - presentation/index.html
   - public index.html

   Data priority:
   1. Admin browser localStorage
   2. Published data/websites.json
   3. Built-in defaults
*/

(() => {
  "use strict";

  /* =========================================================
     STORAGE
  ========================================================= */

  const KEY = "websiteDealsWebsites";

  const SETTINGS_KEY = "websiteDealsSettings";

  const WA = "8801705633700";


  /* =========================================================
     ROOT PATH
  ========================================================= */

  const ROOT =
    (
      document.currentScript &&
      document.currentScript.src
    )
      ? document.currentScript.src.replace(
          /shared\/store\.js.*$/,
          ""
        )
      : "./";


  /* =========================================================
     DEFAULT WEBSITES
  ========================================================= */

  const DEFAULTS = [

    {
      id: "snk-it-institute",

      name: "SNK IT Institute",

      package: "business",

      packageLabel: "Business Package",

      url: "https://snkitinstitute.com",

      animation: "zoom",

      status: true,

      showcase: true,

      sort: 1,

      note: ""
    }

  ];


  /* =========================================================
     PACKAGE LABELS
  ========================================================= */

  const LABELS = {

    starter:
      "Starter Package",

    business:
      "Business Package",

    premium:
      "Premium Package"

  };


  /* =========================================================
     DEFAULT SETTINGS
  ========================================================= */

  const DEFAULT_SETTINGS = {

    brandName:
      "Website Deals",

    shortName:
      "Website Deals",

    tagline:
      "Premium Ready-Made Websites",

    metaDescription:
      "Premium ready-made websites, monthly website packages and live website presentation by Website Deals.",

    supportUrl:
      "https://support.websitedeals.com",

    supportEmail:
      "support@websitedeals.com",

    whatsapp:
      "",

    supportMessage:
      "Need help choosing a website? Our support team is ready to help.",

    showcaseEnabled:
      true,

    autoPresentation:
      true,

    humanCursor:
      true,

    pauseOnHover:
      true,

    scrollSpeed:
      1,

    readingPause:
      2.5,

    presentationMode:
      "natural",

    showPackages:
      true,

    showWebsites:
      true,

    showSalah:
      true,

    showAbout:
      true,

    language:
      "bn-en",

    currency:
      "BDT",

    deviceMode:
      "desktop",

    websiteSort:
      "manual"

  };


  /* =========================================================
     ESCAPE HTML
  ========================================================= */

  const esc = (value) => {

    return String(
      value ?? ""
    ).replace(
      /[&<>"']/g,
      (character) => {

        return {

          "&": "&amp;",

          "<": "&lt;",

          ">": "&gt;",

          '"': "&quot;",

          "'": "&#039;"

        }[character];

      }
    );

  };


  /* =========================================================
     SAFE URL
  ========================================================= */

  const safeUrl = (value) => {

    try {

      const url =
        new URL(
          String(value || "")
        );

      if(
        !/^https?:$/.test(
          url.protocol
        )
      ){

        return "";

      }

      return url.href;

    } catch(error) {

      return "";

    }

  };


  /* =========================================================
     NORMALIZE WEBSITE
  ========================================================= */

  function normalize(
    site,
    index = 0
  ){

    const source =
      site &&
      typeof site === "object"
        ? site
        : {};


    const packageName =
      String(
        source.package || ""
      )
      .trim()
      .toLowerCase();


    const animation =
      [
        "zoom",
        "slide",
        "float"
      ].includes(
        source.animation
      )
        ? source.animation
        : "zoom";


    const status =
      !(
        source.status === false ||
        source.status === "false" ||
        source.status === 0 ||
        source.status === "0"
      );


    /*
      IMPORTANT:
      showcase is intentionally preserved.

      If showcase is omitted,
      default to true.
    */

    const showcase =
      !(
        source.showcase === false ||
        source.showcase === "false" ||
        source.showcase === 0 ||
        source.showcase === "0"
      );


    const sortValue =
      Number(
        source.sort
      );


    return {

      id:
        String(
          source.id ||
          `site-${index + 1}`
        ),

      name:
        String(
          source.name ||
          "Untitled Website"
        ).trim(),

      package:
        packageName,

      packageLabel:
        String(
          source.packageLabel ||
          LABELS[packageName] ||
          "Website Package"
        ),

      url:
        String(
          source.url ||
          ""
        ).trim(),

      animation,

      status,

      showcase,

      sort:
        Number.isFinite(sortValue)
          ? sortValue
          : 0,

      /*
        Admin note is preserved.
      */

      note:
        String(
          source.note ||
          ""
        ).trim()

    };

  }


  /* =========================================================
     NORMALIZE LIST
  ========================================================= */

  function normalizeList(
    list
  ){

    if(
      !Array.isArray(list)
    ){

      return [];

    }

    return list.map(
      (site, index) =>
        normalize(
          site,
          index
        )
    );

  }


  /* =========================================================
     READ LOCAL WEBSITE DATA
  ========================================================= */

  function readLocal(){

    try {

      const raw =
        localStorage.getItem(
          KEY
        );


      if(!raw){

        return null;

      }


      const parsed =
        JSON.parse(
          raw
        );


      if(
        !Array.isArray(parsed)
      ){

        return null;

      }


      return normalizeList(
        parsed
      );

    } catch(error) {

      console.warn(
        "Website Deals local data read failed:",
        error
      );

      return null;

    }

  }


  /* =========================================================
     READ PUBLISHED WEBSITE DATA
  ========================================================= */

  async function readPublished(){

    try {

      const response =
        await fetch(
          ROOT +
          "data/websites.json?v=" +
          Date.now(),
          {
            cache:
              "no-store"
          }
        );


      if(
        !response.ok
      ){

        return null;

      }


      const json =
        await response.json();


      if(
        !Array.isArray(json)
      ){

        return null;

      }


      return normalizeList(
        json
      );

    } catch(error) {

      console.warn(
        "Website Deals published data read failed:",
        error
      );

      return null;

    }

  }


  /* =========================================================
     LOAD WEBSITE DATA
  ========================================================= */

  async function load(){

    const local =
      readLocal();


    if(
      Array.isArray(local)
    ){

      return {

        sites:
          local,

        source:
          "admin"

      };

    }


    const published =
      await readPublished();


    if(
      Array.isArray(published)
    ){

      return {

        sites:
          published,

        source:
          "published"

      };

    }


    return {

      sites:
        normalizeList(
          DEFAULTS
        ),

      source:
        "default"

    };

  }


  /* =========================================================
     ACTIVE WEBSITES
  ========================================================= */

  function active(
    list
  ){

    return normalizeList(
      list
    )
    .filter(
      (site) => {

        return (
          site.status === true &&
          safeUrl(site.url)
        );

      }
    )
    .sort(
      (a, b) => {

        return (
          a.sort -
          b.sort
        );

      }
    );

  }


  /* =========================================================
     SHOWCASE WEBSITES
  ========================================================= */

  function showcase(
    list
  ){

    return active(
      list
    )
    .filter(
      (site) =>
        site.showcase !== false
    );

  }


  /* =========================================================
     HERO WEBSITE
  =========================================================

     Hero is determined by:

     1. Active
     2. Valid URL
     3. Showcase enabled
     4. Lowest sort number
  ========================================================= */

  function hero(
    list
  ){

    const sites =
      showcase(
        list
      );


    return (
      sites[0] ||
      null
    );

  }


  /* =========================================================
     FIND WEBSITE
  ========================================================= */

  function find(
    list,
    id
  ){

    if(
      !Array.isArray(list)
    ){

      return null;

    }


    return (
      list.find(
        (site) =>
          String(site.id) ===
          String(id)
      ) ||
      null
    );

  }


  /* =========================================================
     SAVE WEBSITE LIST
  ========================================================= */

  function save(
    list
  ){

    const normalized =
      normalizeList(
        list
      );


    localStorage.setItem(
      KEY,
      JSON.stringify(
        normalized
      )
    );


    window.dispatchEvent(
      new CustomEvent(
        "wd:sites-changed",
        {
          detail: {
            sites:
              normalized
          }
        }
      )
    );


    return normalized;

  }


  /* =========================================================
     CLEAR LOCAL WEBSITE DATA
  ========================================================= */

  function clearLocal(){

    localStorage.removeItem(
      KEY
    );


    window.dispatchEvent(
      new CustomEvent(
        "wd:sites-changed",
        {
          detail: {
            cleared:
              true
          }
        }
      )
    );

  }


  /* =========================================================
     WEBSITE CHANGE LISTENER
  ========================================================= */

  function onChange(
    callback
  ){

    if(
      typeof callback !==
      "function"
    ){

      return;

    }


    window.addEventListener(
      "storage",
      (event) => {

        if(
          event.key === KEY ||
          event.key === null
        ){

          callback(
            event
          );

        }

      }
    );


    window.addEventListener(
      "wd:sites-changed",
      callback
    );

  }


  /* =========================================================
     DOWNLOAD WEBSITE JSON
  ========================================================= */

  function download(
    list,
    filename =
      "websites.json"
  ){

    const normalized =
      normalizeList(
        list
      );


    const blob =
      new Blob(
        [
          JSON.stringify(
            normalized,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const anchor =
      document.createElement(
        "a"
      );


    anchor.href =
      url;

    anchor.download =
      filename;


    document.body.appendChild(
      anchor
    );


    anchor.click();


    anchor.remove();


    setTimeout(
      () => {

        URL.revokeObjectURL(
          url
        );

      },
      1000
    );

  }


  /* =========================================================
     READ SETTINGS
  ========================================================= */

  function readSettings(){

    try {

      const raw =
        localStorage.getItem(
          SETTINGS_KEY
        );


      if(!raw){

        return {
          ...DEFAULT_SETTINGS
        };

      }


      const parsed =
        JSON.parse(
          raw
        );


      return {

        ...DEFAULT_SETTINGS,

        ...(parsed || {})

      };

    } catch(error) {

      console.warn(
        "Website Deals settings read failed:",
        error
      );


      return {
        ...DEFAULT_SETTINGS
      };

    }

  }


  /* =========================================================
     SAVE SETTINGS
  ========================================================= */

  function saveSettings(
    settings
  ){

    const merged = {

      ...DEFAULT_SETTINGS,

      ...(settings || {})

    };


    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(
        merged
      )
    );


    window.dispatchEvent(
      new CustomEvent(
        "wd:settings-changed",
        {
          detail: {
            settings:
              merged
          }
        }
      )
    );


    return merged;

  }


  /* =========================================================
     CLEAR SETTINGS
  ========================================================= */

  function clearSettings(){

    localStorage.removeItem(
      SETTINGS_KEY
    );


    window.dispatchEvent(
      new CustomEvent(
        "wd:settings-changed",
        {
          detail: {
            cleared:
              true
          }
        }
      )
    );

  }


  /* =========================================================
     SETTINGS CHANGE LISTENER
  ========================================================= */

  function onSettingsChange(
    callback
  ){

    if(
      typeof callback !==
      "function"
    ){

      return;

    }


    window.addEventListener(
      "storage",
      (event) => {

        if(
          event.key ===
            SETTINGS_KEY ||
          event.key === null
        ){

          callback(
            event
          );

        }

      }
    );


    window.addEventListener(
      "wd:settings-changed",
      callback
    );

  }


  /* =========================================================
     WHATSAPP
  ========================================================= */

  const wa = (
    text
  ) => {

    return (
      "https://wa.me/" +
      WA +
      "?text=" +
      encodeURIComponent(
        text
      )
    );

  };


  /* =========================================================
     GET PACKAGE LABEL
  ========================================================= */

  function packageLabel(
    packageName
  ){

    const key =
      String(
        packageName ||
        ""
      )
      .toLowerCase();


    return (
      LABELS[key] ||
      "Website Package"
    );

  }


  /* =========================================================
     PUBLIC API
  ========================================================= */

  /* SYNC LIST: admin data -> cached published data -> defaults */
  let _pub=null;
  readPublished().then(function(l){if(Array.isArray(l)&&l.length){_pub=l;try{window.dispatchEvent(new CustomEvent("wd:sites-changed",{detail:{published:true}}))}catch(e){}}});
  function list(){
    const local=readLocal();
    if(Array.isArray(local))return local;
    return _pub||normalizeList(DEFAULTS);
  }

  window.WDStore = {
    list,

    KEY,

    SETTINGS_KEY,

    ROOT,

    WA,

    LABELS,

    DEFAULTS,

    DEFAULT_SETTINGS,

    esc,

    safeUrl,

    normalize,

    normalizeList,

    load,

    readLocal,

    readPublished,

    active,

    showcase,

    hero,

    find,

    save,

    clearLocal,

    onChange,

    download,

    readSettings,

    saveSettings,

    clearSettings,

    onSettingsChange,

    packageLabel,

    wa

  };


})();
