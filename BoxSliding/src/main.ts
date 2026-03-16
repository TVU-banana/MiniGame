import './styles/main.css';
import { App } from './app/App';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('未找到 #app 节点');
}

const app = new App(root);
app.mount();
