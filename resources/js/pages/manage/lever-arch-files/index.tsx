import FilingItemManagement, {
    type FilingItemManagementProps,
} from '../components/filing-item-management';
import { index } from '@/routes/manage/lever-arch-files';

export default function LeverArchFiles(props: FilingItemManagementProps) {
    return <FilingItemManagement {...props} kind="lever_arch" />;
}

LeverArchFiles.layout = {
    breadcrumbs: [
        { title: 'Manage', href: index() },
        { title: 'Lever arch files', href: index() },
    ],
};
