{
  description = "Party Owl '84 VS Code Theme - Development environment and baked VS Code derivation";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:

      let
        # Unified approach for handling unfree packages
        pkgsAllowUnfree = import nixpkgs {
          system = system;
          config.allowUnfree = true;
          config.allowUnfreePredicate = pkg: builtins.elem (pkgs.lib.getName pkg) [
            "vscode"
            "vscode-extension-MS-python-python"
            "vscode-extension-ms-vscode-cpptools"
            "vscode-extension-ms-vsliveshare-vsliveshare"
          ];
        };
        pkgs = pkgsAllowUnfree;

        # Extension metadata
        packageJson = builtins.fromJSON (builtins.readFile "${./.}/package.json");
        extensionName = "partyowl84";
        extensionVersion = packageJson.version;

        # Vendor npm dependencies for reproducible builds
        npmDeps = pkgs.fetchNpmDeps {
          name = "partyowl84-npm-deps";
          src = ./.;
          hash = "sha256-pRhxA8oFzhWZfGA2HAJP+Y0YhFC87eGfOacRHPbPOGE=";
        };

        # Only include files needed for the build — excludes .git, build artifacts, etc.
        src = pkgs.lib.fileset.toSource {
          root = ./.;
          fileset = pkgs.lib.fileset.unions [
            ./.vscodeignore
            ./src
            ./themes
            ./icon.png
            ./package.json
            ./README.md
            ./LICENSE
          ];
        };

        bakedSrc = src // pkgs.lib.fileset.toSource {
          root = ./.;
          fileset = pkgs.lib.fileset.unions [
            ./patches
            ./scripts
          ];
        };

        # Build the VS Code extension
        party-owl-extension = pkgs.stdenv.mkDerivation {
          pname = "${extensionName}-vscode-extension";
          version = extensionVersion;

          inherit src npmDeps;

          nativeBuildInputs = with pkgs; [ nodejs nodePackages.npm vsce ];

          buildPhase = ''
            # Use vendored node_modules for reproducible builds
            if [ -d "$npmDeps" ]; then
              cp -r $npmDeps node_modules
            fi
            # Install dependencies if needed (no-op if none)
            if [ -f package.json ]; then
              npm install --offline --ignore-scripts --no-audit --no-fund || true
            fi
            # Package the extension as .vsix
            vsce package --no-git-tag-version --skip-license --no-update-package-json --allow-star-activation --no-dependencies --out partyowl84.vsix
          '';

          installPhase = ''
            mkdir -p $out/share/vscode/extensions/${extensionName}
            cp -r . $out/share/vscode/extensions/${extensionName}/
            # Copy the .vsix file to $out
            mkdir -p $out/vsix
            cp partyowl84.vsix $out/vsix/
          '';
        };

        # Pre-patched VS Code with Party Owl '84 theme built-in
        party-owl-vscode = pkgs.vscode.overrideAttrs (oldAttrs: {
          pname = "vscode-${extensionName}";
          version = "${oldAttrs.version}-vsc-${extensionVersion}-po84";
          __intentionallyOverridingVersion = true;

          inherit bakedSrc;

          buildInputs = (oldAttrs.buildInputs or []) ++ [ pkgs.jq pkgs.openssl ];

          installPhase = (oldAttrs.installPhase or "") + (builtins.readFile (pkgs.replaceVars ./scripts/inject-theme.sh {
            PARTY_OWL_EXTENSION = party-owl-extension;
            EXTENSION_NAME = extensionName;
            PATCHES_DIR = "${self}/patches";
            PATCH_BIN = "${pkgs.patch}/bin/patch";
            JQ_BIN = "${pkgs.jq}/bin/jq";
          }));

          # Fix wrapGAppsHook unbound variable bug - initialize to empty so hook can run normally
          # Hook will respect dontWrapGApps=true and skip wrapping while avoiding [ -z "$var" ] error
          preFixup = ''
            wrapGAppsHookHasRun=""
          '' + (oldAttrs.preFixup or "");

          # Recalculate checksums in postFixup
          postFixup = (oldAttrs.postFixup or "") + (builtins.readFile (pkgs.replaceVars ./scripts/update-checksums.sh {
            JQ_BIN = "${pkgs.jq}/bin/jq";
            OPENSSL_BIN = "${pkgs.openssl}/bin/openssl";
          }));
        });

      in {
        packages = {
          default = party-owl-extension;
          extension = party-owl-extension;
          vscode-partyowl84 = party-owl-vscode;
        };

        devShells.default =
          let devEnv = import ./dev-env.nix { pkgs = pkgs; };
          in pkgs.mkShell {
            inherit (devEnv) buildInputs shellHook;
          };

        apps = {
          package-extension = {
            type = "app";
            program = "${pkgs.writeShellScript "package-${extensionName}" ''
              export PATH="${pkgs.nodejs}/bin:${pkgs.nodePackages.npm}/bin:${pkgs.vsce}/bin:$PATH"
              ${pkgs.vsce}/bin/vsce package --no-git-tag-version --skip-license --no-update-package-json --allow-star-activation --no-dependencies --allow-package-all-secrets
            ''}";
            meta = {
              description = "Package Party Owl 84 VS Code theme extension as .vsix file";
              license = nixpkgs.lib.licenses.mit;
            };
          };
        };
      });
}