import React, { ReactNode } from 'react';

import { useRouter } from 'next/router';

import { useCanEditProject } from 'hooks/permissions';

import Button from 'components/button';

export interface ItemSettingsProps {
  children: ReactNode;
  onDelete?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  onDuplicate?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const Item: React.FC<ItemSettingsProps> = ({
  children,
  onDelete,
  onDuplicate,
}: ItemSettingsProps) => {
  const { query } = useRouter();
  const { pid } = query;

  const editable = useCanEditProject(pid);

  return (
    <div className="w-full px-8 pt-6 pb-4 bg-gray-700 rounded-b-3xl">
      {children}

      <div className="flex justify-end w-full space-x-1 mt-2.5">
        <Button
          className="flex-shrink-0"
          size="s"
          theme="secondary"
          disabled={!editable}
          onClick={onDuplicate}
        >
          Duplicate
        </Button>

        <Button
          className="flex-shrink-0"
          size="s"
          theme="secondary"
          disabled={!editable}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default Item;
