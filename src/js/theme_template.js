(function () {

  // Grab body node
  const bodyNode = document.querySelector('body');

  // Replace the styles with the glow theme
  const initPartyLights = (disableGlow, obs) => {
    var themeStyleTag = document.querySelector('.vscode-tokens-styles');

    if (!themeStyleTag) {
      return;
    }

    var initialThemeStyles = themeStyleTag.innerText;
    
    var updatedThemeStyles = initialThemeStyles;
    
    if (!disableGlow) {
      /* replace orange */
      /*updatedThemeStyles = updatedThemeStyles.replace(/color: #ecc48d;/g, "color: #ecc48d; text-shadow: 0 0 2px #eecea1, 0 0 3px #ebd1ad[NEON_BRIGHTNESS], 0 0 5px #f3e8d9[NEON_BRIGHTNESS];"); */
      
      /* replace red */
      updatedThemeStyles = updatedThemeStyles.replace(/color: #d64a53;/g, "color: #ff3341; text-shadow: 0 0 2px #ff4a00, 0 0 3px #fc1f2c[NEON_BRIGHTNESS], 0 0 5px #fc1f2c[NEON_BRIGHTNESS];");
      
      /* replace yellow */
      updatedThemeStyles = updatedThemeStyles.replace(/color: #fede5d;/g, "color: #f9faaa; text-shadow: 0 0 2px #f9faaa, 0 0 3px #f39f05[NEON_BRIGHTNESS], 0 0 5px #f39f05[NEON_BRIGHTNESS], 0 0 8px #f39f05[NEON_BRIGHTNESS];");
      
      /* replace green */
      updatedThemeStyles = updatedThemeStyles.replace(/color: #7fdbca;/g, "color: #7fdbca; text-shadow: 0 0 2px #100c0f, 0 0 5px #17f1c9[NEON_BRIGHTNESS], 0 0 8px #52e6cb[NEON_BRIGHTNESS];");
      
      /* replace pink */
      updatedThemeStyles = updatedThemeStyles.replace(/color: #c792ea;/g, "color: #c792ea; text-shadow: 0 0 2px #001716, 0 0 3px #ae46f3[NEON_BRIGHTNESS], 0 0 5px #ba6eec[NEON_BRIGHTNESS], 0 0 8px #c792ea[NEON_BRIGHTNESS];");

      /* replace periwinkle */
      updatedThemeStyles = updatedThemeStyles.replace(/color: #82aaff;/g, "color: #82aaff; text-shadow: 0 0 2px #001716, 0 0 3px #3370f3[NEON_BRIGHTNESS], 0 0 5px #4e83f5[NEON_BRIGHTNESS], 0 0 8px #8badf5[NEON_BRIGHTNESS];");

      /* UPDATED replace light grey */
      //updatedThemeStyles = updatedThemeStyles.replace(/color: #d6deeb;/g, "color: #d6deeb; text-shadow: 0 0 2px #001716, 0 0 3px #d6deeb[NEON_BRIGHTNESS], 0 0 5px #d6deeb[NEON_BRIGHTNESS], 0 0 8px #d6deeb[NEON_BRIGHTNESS];");

      /* replace teal */
      updatedThemeStyles = updatedThemeStyles.replace(/color: #57eaf1;/g, "color: #3fe7ef; text-shadow: 0 0 2px #100c0f, 0 0 5px #57eaf1[NEON_BRIGHTNESS], 0 0 8px #86f0f5[NEON_BRIGHTNESS];");

      /* replace purple */
      updatedThemeStyles = updatedThemeStyles.replace(/color: #5b36ff;/g, "color: #5636ff; text-shadow: 0 0 2px #100c0f, 0 0 5px #7050ff[NEON_BRIGHTNESS], 0 0 8px #9982ff[NEON_BRIGHTNESS];");
    }

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

  // Callback function to execute when mutations are observed
  const watchForBootstrap = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
          if (mutation.type === 'attributes') {
            // only init if we're using a Party Owl 84 subtheme
            const isUsingPartyOwl = document.querySelector('[class*="sabrsorensen-party-owl-84-themes"]');
            // does the style div exist yet?
            const tokensLoaded = document.querySelector('.vscode-tokens-styles');
            // does it have content ?
            const tokenStyles = document.querySelector('.vscode-tokens-styles').innerText 
                                && document.querySelector('.vscode-tokens-styles').innerText !== '';

            if (isUsingPartyOwl && tokensLoaded) {
              if (!tokenStyles) {
                // sometimes VS code takes a while to init the styles content, so if there stop this observer and add an observer for that
                observer.disconnect();
                observer.observe(tokensLoaded, { childList: true });
              } else {
                // If everything we need is ready, then initialise
                initPartyLights([DISABLE_GLOW], observer);
              }
            }
          }
          if (mutation.type === 'childList') {
            const isUsingPartyOwl = document.querySelector('[class*="sabrsorensen-party-owl-84-themes"]');
            const tokensLoaded = document.querySelector('.vscode-tokens-styles');
            const tokenStyles = document.querySelector('.vscode-tokens-styles').innerText 
                                && document.querySelector('.vscode-tokens-styles').innerText !== '';

            // Everything we need is ready, so initialise
            if (isUsingPartyOwl && tokensLoaded && tokenStyles) {
                initPartyLights([DISABLE_GLOW], observer);
            }
          }
      }
  };

  // try to initialise the theme
  initPartyLights([DISABLE_GLOW]);

  // Use a mutation observer to check when we can bootstrap the theme
  const observer = new MutationObserver(watchForBootstrap);
  observer.observe(bodyNode, { attributes: true });

})();
