(function () {
  //====================================
  // Theme replacement CSS (Glow styles)
  //====================================
  const tokenReplacements = {
    
      /* replace orange */
      /*'ecc48d': "color: #ecc48d; text-shadow: 0 0 2px #eecea1, 0 0 3px #ebd1ad[NEON_BRIGHTNESS], 0 0 5px #f3e8d9[NEON_BRIGHTNESS]; backface-visibility: hidden;", */
      /* replace red */
      'd64a53': "color: #ff3341; text-shadow: 0 0 2px #ff4a00, 0 0 3px #fc1f2c[NEON_BRIGHTNESS], 0 0 5px #fc1f2c[NEON_BRIGHTNESS]; backface-visibility: hidden;",
      /* replace yellow */
      'fede5d': "color: #f9faaa; text-shadow: 0 0 2px #f9faaa, 0 0 3px #f39f05[NEON_BRIGHTNESS], 0 0 5px #f39f05[NEON_BRIGHTNESS], 0 0 8px #f39f05[NEON_BRIGHTNESS]; backface-visibility: hidden;",
      /* replace green */
      '7fdbca': "color: #7fdbca; text-shadow: 0 0 2px #100c0f, 0 0 5px #17f1c9[NEON_BRIGHTNESS], 0 0 8px #52e6cb[NEON_BRIGHTNESS]; backface-visibility: hidden;",
      /* replace pink */
      'c792ea': "color: #c792ea; text-shadow: 0 0 2px #001716, 0 0 3px #ae46f3[NEON_BRIGHTNESS], 0 0 5px #ba6eec[NEON_BRIGHTNESS], 0 0 8px #c792ea[NEON_BRIGHTNESS]; backface-visibility: hidden;",
      /* replace periwinkle */
      '82aaff': "color: #82aaff; text-shadow: 0 0 2px #001716, 0 0 3px #3370f3[NEON_BRIGHTNESS], 0 0 5px #4e83f5[NEON_BRIGHTNESS], 0 0 8px #8badf5[NEON_BRIGHTNESS]; backface-visibility: hidden;",
      /* UPDATED replace light grey */
      /*'d6deeb': "color: #d6deeb; text-shadow: 0 0 2px #001716, 0 0 3px #d6deeb[NEON_BRIGHTNESS], 0 0 5px #d6deeb[NEON_BRIGHTNESS], 0 0 8px #d6deeb[NEON_BRIGHTNESS]; backface-visibility: hidden;", */
      /* replace teal */
      '57eaf1': "color: #3fe7ef; text-shadow: 0 0 2px #100c0f, 0 0 5px #57eaf1[NEON_BRIGHTNESS], 0 0 8px #86f0f5[NEON_BRIGHTNESS]; backface-visibility: hidden;",
      /* replace purple */
      '5b36ff': "color: #5636ff; text-shadow: 0 0 2px #100c0f, 0 0 5px #7050ff[NEON_BRIGHTNESS], 0 0 8px #9982ff[NEON_BRIGHTNESS]; backface-visibility: hidden;"
};

  //=============================
  // Helper functions
  //=============================

  /**
   * @summary Check if the style element exists and that it has party owl '84 color content
   * @param {HTMLElement} tokensEl the style tag
   * @param {object} replacements key/value pairs of colour hex and the glow styles to replace them with
   * @returns {boolean}
   */
  const themeStylesExist = (tokensEl, replacements) => {
    return tokensEl.innerText !== '' &&
      Object.keys(replacements).every(color => {
        return tokensEl.innerText.toLowerCase().includes(`#${color}`);
      });
  };

  /**
   * @summary Search and replace colours within a CSS definition
   * @param {string} styles the text content of the style tag
   * @param {object} replacements key/value pairs of colour hex and the glow styles to replace them with
   * @returns
   */
  const replaceTokens = (styles, replacements) => Object.keys(replacements).reduce((acc, color) => {
    const re = new RegExp(`color: #${color};`, 'gi');
    return acc.replace(re, replacements[color]);
  }, styles);

  /**
   * @summary Checks if a theme is applied, and that the theme belongs to the Party Owl 84 family
   * @returns {boolean}
   */
  const usingPartyOwl = () => {
    const appliedTheme = document.querySelector('[class*="theme-json"]');
    const partyOwlTheme = document.querySelector('[class*="sabrsorensen-party-owl-84-themes"]');
    return appliedTheme && partyOwlTheme;
  }

  /**
   * @summary Checks if the theme is party owl, and that the styles exist, ready for replacement
   * @param {HTMLElement} tokensEl the style tag
   * @param {object} replacements key/value pairs of colour hex and the glow styles to replace them with
   * @returns
   */
  const readyForReplacement = (tokensEl, tokenReplacements) => tokensEl
    ? (
      // only init if we're using a Party Owl 84 subtheme
      usingPartyOwl() &&
      // does it have content ?
      themeStylesExist(tokensEl, tokenReplacements)
    )
    : false;

  /**
   * @summary Attempts to bootstrap the theme
   * @param {boolean} disableGlow
   * @param {MutationObserver} obs
   */
  const initNeonDreams = (disableGlow, obs) => {
    const tokensEl = document.querySelector('.vscode-tokens-styles');

    if (!tokensEl || !readyForReplacement(tokensEl, tokenReplacements)) {
      return;
    }

    const initialThemeStyles = tokensEl.innerText;

    // Replace tokens with glow styles
    let updatedThemeStyles = !disableGlow
      ? replaceTokens(initialThemeStyles, tokenReplacements)
      : initialThemeStyles;

    /* append the remaining styles */
    updatedThemeStyles = `${updatedThemeStyles}[CHROME_STYLES]`;

    const newStyleTag = document.createElement('style');
    newStyleTag.setAttribute("id", "partyowl84-theme-styles");
    newStyleTag.innerText = updatedThemeStyles.replace(/(\r\n|\n|\r)/gm, '');
    document.body.appendChild(newStyleTag);
    
    console.log('Party Owl \'84: Party Lights initialized!');
    
    // disconnect the observer because we don't need it anymore
    if (obs) {
      obs.disconnect();
      obs = null;
    }
  };

  /**
   * @summary A MutationObserver callback that attempts to bootstrap the theme and assigns a retry attempt if it fails
   */
  const watchForBootstrap = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
      if (mutation.type === 'attributes') {
        // does the style div exist yet?
        const tokensEl = document.querySelector('.vscode-tokens-styles');
        if (readyForReplacement(tokensEl, tokenReplacements)) {
          // If everything we need is ready, then initialise
          initNeonDreams([DISABLE_GLOW], observer);
        } else {
          // sometimes VS code takes a while to init the styles content, so if there stop this observer and add an observer for that
          observer.disconnect();
          observer.observe(tokensEl, { childList: true });
        }
      }
      if (mutation.type === 'childList') {
        const tokensEl = document.querySelector('.vscode-tokens-styles');
        if (readyForReplacement(tokensEl, tokenReplacements)) {
          // Everything we need should be ready now, so initialise
          initNeonDreams([DISABLE_GLOW], observer);
        }
      }
    }
  };

  //=============================
  // Start bootstrapping!
  //=============================
  initPartyLights([DISABLE_GLOW]);
  // Grab body node
  const bodyNode = document.querySelector('body');
  // Use a mutation observer to check when we can bootstrap the theme
  const observer = new MutationObserver(watchForBootstrap);
  observer.observe(bodyNode, { attributes: true });
})();
