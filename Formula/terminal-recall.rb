class TerminalRecall < Formula
  desc "Keep selected terminal output searchable and encrypted locally"
  homepage "https://terminal-recall.sociobot.in"
  version "0.1.4"
  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.4/terminal-recall-macos-arm64.tar.gz"
      sha256 "151f7a45044a9f3161be8a9d7d76c8ab47fab671c04e0e721721e9f009466717"
    else
      url "https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.4/terminal-recall-macos-x86_64.tar.gz"
      sha256 "4ffe206fd4961932235f297c63efc7a184027979692634940065a83502298af3"
    end
  end
  on_linux do
    url "https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.4/terminal-recall-linux-x86_64.tar.gz"
    sha256 "2719e3ad9323f8beef1e08f39d552b45ff259d6a73c2bfd70a3aeff066cd3a0b"
  end
  def install
    bin.install "terminal-recall"
  end
end
