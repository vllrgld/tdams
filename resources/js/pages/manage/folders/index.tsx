import FilingItemManagement, {
    type FilingItemManagementProps,
} from '../components/filing-item-management';
import { index } from '@/routes/manage/folders';

export default function Folders(props: FilingItemManagementProps) {
    return <FilingItemManagement {...props} kind="folder" />;
}

Folders.layout = {
    breadcrumbs: [
        { title: 'Manage', href: index() },
        { title: 'Folders', href: index() },
    ],
};
