class TerminalRecall < Formula
  desc "Keep selected terminal output searchable and encrypted locally"
  homepage "https://terminal-recall.sociobot.in"
  url "https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.2/terminal-recall-linux-x86_64.tar.gz"
  sha256 "217a719d84906b8d4f7faf6e7d5a132d88d3b64744495b0e0edbccf7ec2761a2"
  version "0.1.2"

  def install
    bin.install "terminal-recall"
  end
end
