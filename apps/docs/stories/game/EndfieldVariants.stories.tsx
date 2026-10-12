import {
  Button,
  Crosshair,
  Dialog,
  DialogClose,
  Field,
  Input,
  Select,
} from "@endfield-ui/react";
import { AnimatedDialog, RoundedSelect } from "@endfield-ui/react/game";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const regions = [
  { value: "valley", label: "四号谷地" },
  { value: "wuling", label: "武陵" },
  { value: "other", label: "其他" },
];

function FormContents() {
  const [region, setRegion] = useState("valley");
  return (
    <div className="grid gap-5 p-6">
      <Field label="名称">
        <Input defaultValue="北区仓储站" />
      </Field>
      <Field label="圆角下拉">
        <RoundedSelect
          options={regions}
          value={region}
          onValueChange={setRegion}
        />
      </Field>
      <Field label="原有下拉">
        <Select items={regions} defaultValue="wuling" />
      </Field>
      <div className="flex justify-end">
        <DialogClose>
          <Button>完成</Button>
        </DialogClose>
      </div>
    </div>
  );
}

function VariantsPreview() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Select">
          <Select items={regions} defaultValue="valley" />
        </Field>
        <Field label="RoundedSelect">
          <RoundedSelect options={regions} defaultValue="valley" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <Dialog
          title="原有弹窗"
          trigger={<Button variant="light">Dialog</Button>}
        >
          <FormContents />
        </Dialog>
        <AnimatedDialog
          title="动画弹窗"
          icon={<Crosshair size={24} />}
          width="640px"
          height="500px"
          trigger={<Button>AnimatedDialog</Button>}
        >
          <FormContents />
        </AnimatedDialog>
      </div>
    </div>
  );
}

const meta = {
  title: "Game 实机风格/示例/弹窗与下拉",
  component: VariantsPreview,
  parameters: { sideBySide: false },
} satisfies Meta<typeof VariantsPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Preview: Story = {};
