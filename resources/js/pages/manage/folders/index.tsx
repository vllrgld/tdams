import BookManagement from '../books';
import type { BookManagementProps } from '../books';

export default function Folders(props: BookManagementProps) {
    return <BookManagement {...props} kind="folder" />;
}

Folders.layout = {
    breadcrumbs: [
        { title: 'Manage', href: '/manage/folders' },
        { title: 'Folders', href: '/manage/folders' },
    ],
};
