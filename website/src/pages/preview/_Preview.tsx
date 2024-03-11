import context from 'src/context';
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import DocsView from '@layouts/DocsView';
import {
  loadContextFromDb,
  fetchIndex,
  verifyPermission,
  loadDirectoryContents,
  addFileToDb,
  saveConfigInDb,
  saveContextInIDB,
  init,
  isFileSystemAccessAPIAvailable,
  saveToIDb,
  saveFileHandleInIDB,
  getFileHandleFromIDB,
  loadContents,
} from './helpers';

export default function Preview(props: { previewPath?: string | undefined }) {
  const { previewPath } = props;
  const { isPreviewReady } = useStore(context);
  const isFileSystemAvailable = isFileSystemAccessAPIAvailable();

  useEffect(() => {
    const possibleFileKeys = previewPath
      ? [`${previewPath}/index.mdx`, `${previewPath}.mdx`]
      : ['index.mdx'];
    loadContextFromDb(possibleFileKeys).then(ctx => {
      // load context from IDB if available
      if (ctx) {
        console.log('Loaded context from IDB:', possibleFileKeys, ctx);
        context.set(ctx);
        return;
      }

      // otherwise, initialize the app
      init(possibleFileKeys, context);
    });
  }, []);

  const selectDirectory = async () => {
    try {
      const dirHandleOrUndefined = await getFileHandleFromIDB();
      if (!dirHandleOrUndefined) {
        const handle = await (window as any).showDirectoryPicker();
        saveFileHandleInIDB(handle);
        loadContents(handle, context);
      } else {
        // if we have a handle, verify permission and load contents
        const hasPermission = await verifyPermission(dirHandleOrUndefined, true);
        if (!hasPermission) {
          console.error('Permission denied');
          return;
        }
        loadContents(dirHandleOrUndefined, context);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  return isPreviewReady ? (
    <DocsView />
  ) : (
    <div className="dark:text-white">
      <section className="items-center py-16 px-4 text-center lg:py-32 lg:text-left">
        <div className="mx-auto max-w-6xl tracking-wider">
          <div className="mb-4 flex items-center justify-center space-x-4 lg:justify-between">
            <div className="flex items-center justify-start space-x-4 text-center">
              <h3 className="font-anton text-4xl">docs.page</h3>
              <h3 className="italic">Local Preview Mode (Beta)</h3>
            </div>
          </div>
          <h1 className=" font-anton mt-40 mb-4 bg-gradient-to-br from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-center text-2xl text-transparent dark:from-gray-100 dark:via-gray-300 dark:to-gray-200 lg:text-5xl">
            Preview from your machine
          </h1>
          {isFileSystemAvailable ? (
            <>
              <p suppressHydrationWarning className="pt-20 text-center">
                To get started, simply select the local directory containing your docs.json config
                file:
              </p>
              <div className="w-100% content-center items-center justify-center pt-8 text-center">
                <button
                  className="text-s cursor-pointer whitespace-nowrap rounded-lg bg-green-600 px-3 py-2 text-white shadow transition-colors hover:bg-green-500"
                  onClick={selectDirectory}
                >
                  Select Directory!
                </button>
              </div>
            </>
          ) : (
            <p suppressHydrationWarning className="pt-20 text-center">
              Local Preview Mode is only available on Chrome at the moment, sorry :(
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
