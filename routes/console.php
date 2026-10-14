<?php

use Illuminate\Foundation\DevCommands;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

$getNetworkAddresses = static function (): array {
    $addresses = gethostbynamel(gethostname());

    return collect($addresses === false ? [] : $addresses)
        ->filter(fn (string $address): bool => filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)
            && ! str_starts_with($address, '127.')
            && $address !== '0.0.0.0')
        ->unique()
        ->sort()
        ->values()
        ->all();
};

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('serve:network {--port=8000}', function () use ($getNetworkAddresses) {
    $port = (int) $this->option('port');
    $networkAddresses = $getNetworkAddresses();

    $this->info('Laravel site addresses:');
    $this->line("  Local: http://127.0.0.1:{$port}");

    foreach ($networkAddresses as $address) {
        $this->line("  Network: http://{$address}:{$port}");
    }

    if ($networkAddresses === []) {
        $this->warn('No network IPv4 addresses were detected. The site is still binding to all interfaces.');
    }

    $this->comment('When started with "composer dev", address changes will also be printed.');
    $this->newLine();

    return $this->call('serve', [
        '--host' => '0.0.0.0',
        '--port' => (string) $port,
    ]);
})->purpose('Serve Laravel on all interfaces and print the available site addresses');

Artisan::command('network:watch {--port=8000}', function () use ($getNetworkAddresses) {
    $port = (int) $this->option('port');
    $previousAddresses = $getNetworkAddresses();

    while (true) {
        sleep(3);

        $currentAddresses = $getNetworkAddresses();

        if ($currentAddresses === $previousAddresses) {
            continue;
        }

        $this->newLine();
        $this->info("Laravel network addresses changed (port {$port}):");

        if ($currentAddresses === []) {
            $this->warn('No network IPv4 addresses are currently available.');
        } else {
            foreach ($currentAddresses as $address) {
                $this->line("  Network: http://{$address}:{$port}");
            }
        }

        $previousAddresses = $currentAddresses;
    }
})->purpose('Print updated Laravel access addresses when network connections change');

DevCommands::artisan('serve:network', 'server')->orange();
DevCommands::artisan('network:watch', 'network')->green();
