import React, { useState } from 'react';
import { Language } from '../types/bus';
import { X, Check, Copy, ExternalLink, Github, Sparkles, Terminal } from 'lucide-react';

interface GithubGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const GithubGuideModal: React.FC<GithubGuideModalProps> = ({ isOpen, onClose, lang }) => {
  const [copiedAction, setCopiedAction] = useState(false);

  if (!isOpen) return null;

  const githubActionYaml = `name: Deploy HK Bus ETA to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install --legacy-peer-deps
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const handleCopyYaml = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(githubActionYaml);
      setCopiedAction(true);
      setTimeout(() => setCopiedAction(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-white">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {lang === 'tc' ? 'GitHub Pages 免費託管說明' : 'Free GitHub Pages Hosting Guide'}
              </h3>
              <p className="text-xs text-neutral-400">
                {lang === 'tc' ? '已配置為 100% 純靜態前端應用' : 'Configured for 100% zero-server static hosting'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-sm">
          {/* Key point badge */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-300">
                {lang === 'tc' ? '已為 GitHub Pages 做好完整準備：' : 'Ready for GitHub Pages:'}
              </p>
              <p className="text-neutral-300">
                {lang === 'tc'
                  ? '• vite.config.ts 已設定 base: "./"，支援任意 repository 子路徑。'
                  : '• vite.config.ts is set with base: "./" for automatic subpath routing.'}
              </p>
              <p className="text-neutral-300">
                {lang === 'tc'
                  ? '• 所有巴士開放數據（九巴/城巴/嶼巴）均直接在瀏覽器呼叫官方開放 API (CORS 開啟)。'
                  : '• All HK bus APIs are called directly client-side with CORS enabled.'}
              </p>
            </div>
          </div>

          {/* Quick steps */}
          <div>
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              {lang === 'tc' ? '三步輕鬆發佈至 GitHub Pages:' : '3 Easy Steps to Publish:'}
            </h4>

            <ol className="space-y-3 text-xs text-neutral-300 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                <strong className="text-white">
                  {lang === 'tc' ? '建立 GitHub Repository 並 Push 程式碼' : 'Push code to your GitHub repository'}
                </strong>
                <pre className="mt-1 p-2 bg-neutral-950 rounded-lg border border-neutral-800 font-mono text-[11px] text-amber-400 overflow-x-auto">
                  git init{'\n'}
                  git add .{'\n'}
                  git commit -m "feat: HK bus big screen ETA"{'\n'}
                  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git{'\n'}
                  git push -u origin main
                </pre>
              </li>

              <li className="leading-relaxed">
                <strong className="text-white">
                  {lang === 'tc' ? '開啟 GitHub Pages 自動部署' : 'Enable GitHub Pages in Settings'}
                </strong>
                <p className="text-neutral-400 mt-0.5">
                  {lang === 'tc'
                    ? '進入 Repository ➔ Settings ➔ Pages ➔ Source 選擇 "GitHub Actions"。'
                    : 'Go to Repository ➔ Settings ➔ Pages ➔ Source: choose "GitHub Actions".'}
                </p>
              </li>

              <li className="leading-relaxed">
                <strong className="text-white">
                  {lang === 'tc' ? '新增 GitHub Actions 自動發佈工作流' : 'Add GitHub Actions workflow file'}
                </strong>
                <p className="text-neutral-400 mt-0.5">
                  {lang === 'tc'
                    ? '在專案建立 .github/workflows/deploy.yml 並貼上下方設定：'
                    : 'Create .github/workflows/deploy.yml and paste the YAML below:'}
                </p>
              </li>
            </ol>
          </div>

          {/* YAML Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400">
                .github/workflows/deploy.yml
              </span>
              <button
                onClick={handleCopyYaml}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-lg transition-colors"
              >
                {copiedAction ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAction ? (lang === 'tc' ? '已複製!' : 'Copied!') : (lang === 'tc' ? '複製 YAML' : 'Copy YAML')}</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-48">
              {githubActionYaml}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            {lang === 'tc' ? '明白，關閉' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
