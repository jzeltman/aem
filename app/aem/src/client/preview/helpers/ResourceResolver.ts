import { Runtime, VDOMFactory } from '@adobe/htlengine/src/runtime/Runtime';
import { window } from 'global';

export default class ResourceResolver {
  content = null;

  loader = null;

  components = null;

  constructor(content, componentLoader, components) {
    this.content = content;
    this.loader = componentLoader;
    this.components = components;
  }

  createResourceLoader(passedPath: any) {
    const parentPath = Array.isArray(passedPath)
      ? passedPath
      : passedPath.split('/').filter((s: any) => s);

    return async (runtime, uri) => {
      let path = uri.split('/');
      if (!uri.startsWith('/')) {
        path = parentPath.concat(uri.split('/'));
      }
      path = path.filter(s => !!s);
      // todo: implement relative path...
      let { content } = this;
      const iterator = 0;
      while (content && iterator < path.length && content[':items']) {
        content = content[':items'][path];
      }
      if (!content) {
        // todo: remove debug
        return `no such resource: ${uri}...`;
      }

      // try to get component
      const type = content[':type'];
      const comp = this.loader.resolve(type, this.components);
      if (!comp) {
        // todo: remove debug
        return `no such component: ${type}`;
      }
      // create a new runtime for this component
      const localRuntime = new Runtime()
        .withResourceLoader(this.createResourceLoader(path))
        .withDomFactory(new VDOMFactory(window.document.implementation))
        .setGlobal({
          ...runtime.globals,
          component: {
            properties: comp.properties,
          },
          content,
        });
      return comp.module(localRuntime);
    };
  }
}
