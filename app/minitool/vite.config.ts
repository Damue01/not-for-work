import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
export default defineConfig({
  define:{'process.env.NODE_ENV':JSON.stringify('production')},base:'./',plugins:[{name:'minitool-offline-react',enforce:'pre',transform(code,id){
    if(id.includes('/react-dom/') && id.endsWith('.js')) return code.replaceAll('navigator.connection','undefined').replaceAll('window.clipboardData','undefined');
  }},react(),tailwindcss()],
  resolve:{alias:{'@':path.resolve(import.meta.dirname,'../src')}},
  publicDir:false,
  build:{target:['es2017','chrome61'],cssTarget:'chrome61',outDir:'dist-minitool',emptyOutDir:true,sourcemap:false,
    lib:{entry:path.resolve(import.meta.dirname,'../src/main.tsx'),name:'NotForWork',formats:['iife'],fileName:()=> 'app.js',cssFileName:'style'},
    rolldownOptions:{output:{codeSplitting:false}}}
});
