<?php

namespace Database\Seeders;

use App\Models\Roles;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = ['Admin', 'Customer', 'Manager', 'Transcriptor', 'Supervisor'];

        foreach ($roles as $role) {
            Roles::firstOrCreate(['role_name' => $role]);
        }
    }
}
