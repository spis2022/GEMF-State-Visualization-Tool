{ pkgs }: {
  deps = [
    pkgs.heroku
    pkgs.nodePackages.vscode-langservers-extracted
    pkgs.nodePackages.typescript-language-server
  ];
}