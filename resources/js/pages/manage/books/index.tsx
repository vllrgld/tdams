import FilingItemManagement, {
    type FilingItemManagementProps,
} from '../components/filing-item-management';
import { index } from '@/routes/manage/books';

export default function Books(props: FilingItemManagementProps) {
    return <FilingItemManagement {...props} kind="book" />;
}

Books.layout = {
    breadcrumbs: [
        { title: 'Manage', href: index() },
        { title: 'Books', href: index() },
    ],
};
