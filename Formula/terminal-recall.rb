class TerminalRecall < Formula
  desc "Keep selected terminal output searchable and encrypted locally"
  homepage "https://terminal-recall.sociobot.in"
  url "https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.3/terminal-recall-linux-x86_64.tar.gz"
  sha256 "f6cdd401a662bb851a966d894f846a7be53063c8a92de64b3e9320cb752e7e85"
  version "0.1.3"

  def install
    bin.install "terminal-recall"
  end
end
