class TerminalRecall < Formula
  desc "Keep selected terminal output searchable and encrypted locally"
  homepage "https://terminal-recall.sociobot.in"
  url "https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.1/terminal-recall-linux-x86_64.tar.gz"
  sha256 "dbee1ed39a451d84b2947669b6b6a68120d0d86b91a6ba65eece4020913b00f1"
  version "0.1.1"

  def install
    bin.install "terminal-recall"
  end
end
