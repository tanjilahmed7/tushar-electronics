<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransactionCategory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'type',
        'description',
    ];

    /**
     * Transaction type values (Bangla labels).
     */
    public const TYPES = [
        'credit' => 'ক্রেডিট',
        'debit' => 'ডেবিট',
    ];

    /**
     * Transactions using this category.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'transaction_category_id');
    }
}
