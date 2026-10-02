type SelectionHighlightScene = {
  add: (object: any) => void;
  remove: (object: any) => void;
};

type SelectionHighlightHelper = {
  geometry?: { dispose?: () => void };
  material?: { dispose?: () => void };
  update: () => void;
};

type SelectionHighlightConstructor = new (
  object: any,
  color?: number,
) => SelectionHighlightHelper;

type SelectionHighlightControllerOptions = {
  scene: SelectionHighlightScene;
  BoxHelper: SelectionHighlightConstructor;
  color?: number;
};

export const createSelectionHighlightController = ({
  scene,
  BoxHelper,
  color = 0x356a8a,
}: SelectionHighlightControllerOptions) => {
  let helper: SelectionHighlightHelper | null = null;

  const clear = () => {
    if (!helper) return;

    scene.remove(helper);
    helper.geometry?.dispose?.();
    helper.material?.dispose?.();
    helper = null;
  };

  const select = (object: any) => {
    clear();
    helper = new BoxHelper(object, color);
    scene.add(helper);
    helper.update();
  };

  return { clear, select };
};
