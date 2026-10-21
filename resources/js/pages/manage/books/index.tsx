import { Head } from '@inertiajs/react';

export default function Books() {
    return (
        <>
            <Head title="Books" />
            <main className="min-h-full flex-1 bg-background" />
        </>
    );
}

Books.layout = {
    breadcrumbs: [
        {
            title: 'Manage',
            href: '/manage/books',
        },
        {
            title: 'Books',
            href: '/manage/books',
        },
    ],
};
