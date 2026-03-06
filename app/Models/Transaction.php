<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'transaction_category_id',
        'sim_id',
        'customer_number',
        'amount',
        'date',
        'note',
        'commission',
        'commission_sim_id',
        'fee',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'amount' => 'decimal:2',
            'commission' => 'decimal:2',
            'fee' => 'decimal:2',
        ];
    }

    public function transactionCategory(): BelongsTo
    {
        return $this->belongsTo(TransactionCategory::class);
    }

    public function sim(): BelongsTo
    {
        return $this->belongsTo(Sim::class);
    }

    public function commissionSim(): BelongsTo
    {
        return $this->belongsTo(Sim::class, 'commission_sim_id');
    }
}
