import type { ReactNode } from 'react'
import { formatCents, type ContractorRates } from './lib'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Clause({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="font-medium text-foreground">{title}</h4>
      {children}
    </div>
  )
}

export default function ContractText({ rates }: { rates: ContractorRates }) {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground print:text-black">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide">Hack Club Forge · forge.hackclub.com</p>
        <h2 className="text-xl font-semibold text-foreground">Reviewer — Hack Club Forge Part-Time Contractor</h2>
        <p>
          You've been selected to be a Reviewer for Hack Club Forge. Hack Club Forge is a program where Hack Clubbers
          design and build hardware projects and earn prizes. As a Reviewer you will review projects submitted to Forge,
          and guide the wider reviewer team by answering questions and helping set review standards. Please read this
          Agreement carefully. If you have questions, contact aarav@hackclub.com.
        </p>
      </div>

      <Section title="Governance and Scope">
        <p>
          This contract is governed by the State law of Vermont, and the Federal Laws of the United States of America;
          any disputes regarding this contract shall seek resolution through arbitration or through the courts of
          Vermont.
        </p>
      </Section>

      <Section title="Definitions">
        <ul className="list-disc pl-5 space-y-1">
          <li>"Agreement" means this contract, including all sections and referenced policies.</li>
          <li>
            "Reviewer" means you, the individual signing this Agreement, and any other individual engaged by Hack Club
            HQ to review projects submitted to Forge.
          </li>
          <li>"Forge" refers to the Hack Club event called Hack Club Forge, that can be found at forge.hackclub.com.</li>
          <li>
            "Review" means one completed review of a User project submitted to Forge, carried out in accordance with
            Section 1.2 and tracked through the Forge platform.
          </li>
          <li>
            "User" means a Hack Clubber or user enrolled in the Forge platform who has submitted a project for review.
          </li>
          <li>
            "Hack Club HQ" means the Hack Club HQ leadership team behind Forge, including but not limited to Aarav J
            (aarav@hackclub.com).
          </li>
          <li>
            "End of Forge" means the date that the event, "Forge" ceases to accept submissions, namely through
            rebranding, or a set end date sent out to all users.
          </li>
        </ul>
      </Section>

      <Section title="1. Purpose & Duties">
        <Clause title="1.1 Appointment">
          <p>
            You are appointed as a Reviewer responsible for reviewing project submissions and guiding the Forge Reviewer
            team. In your role you will be responsible for ensuring that reviews are carried out promptly and
            consistently, and for supporting Reviewers with questions and escalations.
          </p>
        </Clause>
        <Clause title="1.2 Core Responsibilities">
          <p>Your responsibilities include:</p>
          <ol className="list-[lower-alpha] pl-5 space-y-1">
            <li>Reviewing projects submitted to Forge promptly and to Forge's review standards.</li>
            <li>
              Guiding other Reviewers: answering their questions, providing feedback on their reviews, and helping
              resolve escalated or unclear submissions.
            </li>
            <li>Communicating with the Reviewer team to discuss weekly goals and performance indicators.</li>
            <li>Reducing the number of pending reviews to 0 by the end of Forge.</li>
          </ol>
        </Clause>
        <Clause title="1.3 Supervision">
          <p>
            Your direct report will be Aarav J (aarav@hackclub.com), with secondary reports being to the rest of Hack
            Club HQ.
          </p>
        </Clause>
      </Section>

      <Section title="2. Term">
        <Clause title="2.1 Duration">
          <p>
            This Agreement begins on the date of your contract signing and continues through to the End of Forge, unless
            terminated earlier per Section 10.
          </p>
        </Clause>
      </Section>

      <Section title="3. Eligibility">
        <Clause title="3.1 Target Audience">
          <p>
            This opportunity is intended for high school students, post-secondary students, gap year students, and
            recent Hack Club alumni.
          </p>
        </Clause>
        <Clause title="3.2 Experience">
          <p>You should have demonstrated experience within Forge and be in good standing with Hack Club.</p>
        </Clause>
      </Section>

      <Section title="4. Status">
        <Clause title="4.1 Legal Relationship">
          <p>
            You are an independent contractor of Hack Club. Either party may terminate this agreement according to
            Section 10.
          </p>
        </Clause>
        <Clause title="4.2 Taxes">
          <p>
            Any honorariums or bonuses you receive are your responsibility to report for tax purposes. Hack Club will not
            withhold taxes on your behalf.
          </p>
        </Clause>
      </Section>

      <Section title="5. Compensation">
        <Clause title="5.1 Per-Review Compensation">
          <p>You will be compensated per completed Review, according to the outcome of the Review:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{formatCents(rates.approve)} for each project approved with a written justification;</li>
            <li>{formatCents(rates.return)} for each project returned;</li>
            <li>{formatCents(rates.reject)} for each project rejected.</li>
          </ul>
          <p>
            Reviews are tracked automatically through the Forge platform. There is no maximum on the number of Reviews
            payable in a week. Only Reviews carried out in accordance with Section 1.2 are payable, and an approval is
            payable at the approval rate only when it is accompanied by a written justification.
          </p>
        </Clause>
        <Clause title="5.2 Payment Timeline">
          <p>
            Per-Review compensation is paid every 2 weeks, based on the Reviews tracked through the Forge platform over
            that period.
          </p>
        </Clause>
        <Clause title="5.3 Rate Changes">
          <p>
            Any pursual of a change to the per-Review rates must be submitted to your direct report in writing, through
            email or Slack, and takes effect only once agreed to in writing by Hack Club HQ.
          </p>
        </Clause>
      </Section>

      <Section title="6. Code of Conduct">
        <Clause title="6.1 Compliance">
          <p>
            You agree to abide by the Hack Club Code of Conduct. Violations may result in immediate termination of this
            Agreement.
          </p>
        </Clause>
      </Section>

      <Section title="7. Privacy & Safety">
        <Clause title="7.1 Non-Disclosure">
          <p>
            You affirm that you have signed a valid Non-Disclosure Agreement which can be found at
            forms.hackclub.com/nda. You agree to not disclose confidential information about unreleased program
            features, Participant personal information, or internal communications and strategy without prior approval
            from Hack Club HQ.
          </p>
        </Clause>
        <Clause title="7.2 Youth Protection">
          <p>
            You agree to complete any required youth protection training and to abide by US Federal Child protection
            laws.
          </p>
        </Clause>
      </Section>

      <Section title="8. Ownership of Intellectual Property">
        <Clause title="8.1 Ownership">
          <p>
            All materials, including but not limited to Workshops, documentation, and content, created specifically for
            Forge during the term of this Agreement become the property of Forge/Hack Club.
          </p>
        </Clause>
        <Clause title="8.2 Materials">
          <p>All Forge trademarks, logos, and branding materials belong to Forge/Hack Club.</p>
        </Clause>
        <Clause title="8.3 Pre-existing IP">
          <p>Any intellectual property you owned before this Agreement remains yours.</p>
        </Clause>
        <Clause title="8.4 License">
          <p>
            Forge/Hack Club grants you a non-exclusive, perpetual license to use materials you created for Forge in your
            personal portfolio and future educational work.
          </p>
        </Clause>
      </Section>

      <Section title="9. Conflict of Interest & Safeguarding">
        <Clause title="9.1 Disclosure">
          <p>
            You agree to disclose any conflicts of interest and to cooperate with Hack Club HQ in mitigating such
            conflicts.
          </p>
        </Clause>
        <Clause title="9.2 Safeguarding">
          <p>You agree to section 7.2.</p>
        </Clause>
      </Section>

      <Section title="10. Termination of Contract">
        <Clause title="10.1 Voluntary Withdrawal">
          <p>
            If you wish to seek voluntary withdrawal, please give 14 days of notice; you will not be required to work
            those days.
          </p>
        </Clause>
        <Clause title="10.2 Termination">
          <p>
            At Hack Club HQ's discretion, you will be terminated if it is found that you have committed a Code of Conduct
            violation, have broken your Non-Disclosure Agreement or have not fulfilled your core responsibilities set out
            in Section 1.2.
          </p>
        </Clause>
        <Clause title="10.3 Offboarding Obligations">
          <p>
            When you are offboarded, please delete any information defined as confidential in your Non-Disclosure
            Agreement.
          </p>
        </Clause>
      </Section>

      <p className="text-xs">
        The Hack Foundation d.b.a. Hack Club · 501(c)(3) nonprofit (EIN 81-2908499) · 15 Falls Road, Shelburne, VT 05482
        · hackclub.com
      </p>
    </div>
  )
}
