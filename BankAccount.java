public class BankAccount {
    private double balance;

    public BankAccount(double balance) {
        this.balance = balance;
    }

    /**
     * Withdraw money from the account.
     *
     * @param amount The amount of money to withdraw.
     */
    public void withdraw(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than zero.");
        }
        try {
            balance -= amount;
        } catch (Exception e) {
            System.out.println("An error occurred while withdrawing money: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        BankAccount account = new BankAccount(1000);
        account.withdraw(-10); // This will print the message but still allow the withdrawal
    }
}
