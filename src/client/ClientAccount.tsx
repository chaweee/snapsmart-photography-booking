import "./Client.css";

function ClientAccount() {
  return (
    <div className="client-page">
      <section className="client-page-heading">
        <div>
          <p>My Account</p>
          <h2>Client profile</h2>
        </div>
      </section>

      <section className="client-account-card">
        <div className="client-account-avatar">C</div>

        <div className="client-account-info">
          <div>
            <span>Full Name</span>
            <strong>Client Santos</strong>
          </div>

          <div>
            <span>Email Address</span>
            <strong>client@gmail.com</strong>
          </div>

          <div>
            <span>Phone Number</span>
            <strong>09XX XXX XXXX</strong>
          </div>

          <div>
            <span>Address</span>
            <strong>Dasmariñas, Cavite</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ClientAccount;